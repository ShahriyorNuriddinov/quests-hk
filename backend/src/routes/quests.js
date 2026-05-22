import { Router } from 'express'
import { findAllQuests, findQuestById } from '../models/Quest.js'
import { requireAuth } from '../middleware/auth.js'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const quests = await findAllQuests({ status: 'published', withSteps: false })
  res.json(quests)
})

router.get('/:id', async (req, res) => {
  const quest = await findQuestById(req.params.id, false)
  if (!quest) return res.status(404).json({ error: 'Not found' })
  res.json(quest)
})

router.get('/:id/reviews', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT r.id, r.rating, r.text, r.photos, r.created_at,
           u.email AS user_email
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.quest_id = $1 AND r.approved = true
    ORDER BY r.created_at DESC
  `, [req.params.id])
  res.json(rows.map(r => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    photos: r.photos || [],
    createdAt: r.created_at,
    userEmail: r.user_email,
  })))
})

router.get('/:id/steps', requireAuth, async (req, res) => {
  const questId = req.params.id
  const hasPurchased = req.user.purchasedQuests.includes(questId)
  if (!hasPurchased && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Purchase required' })
  }
  const quest = await findQuestById(questId, true)
  if (!quest) return res.status(404).json({ error: 'Not found' })
  res.json(quest.steps.sort((a, b) => a.order - b.order))
})

router.put('/:id/progress', requireAuth, async (req, res) => {
  const { current, total } = req.body
  await pool.query(
    'UPDATE user_quests SET progress = $1 WHERE user_id = $2 AND quest_id = $3',
    [JSON.stringify({ current, total }), req.user.id, req.params.id]
  )
  res.json({ ok: true })
})

router.post('/:id/complete', requireAuth, async (req, res) => {
  await pool.query(
    'UPDATE user_quests SET completed = TRUE, progress = NULL WHERE user_id = $1 AND quest_id = $2',
    [req.user.id, req.params.id]
  )
  res.json({ ok: true })
})

router.get('/:id/progress', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT progress, completed FROM user_quests WHERE user_id = $1 AND quest_id = $2',
    [req.user.id, req.params.id]
  )
  if (!rows.length) return res.json({ progress: null, completed: false })
  res.json({ progress: rows[0].progress, completed: rows[0].completed })
})

export default router
