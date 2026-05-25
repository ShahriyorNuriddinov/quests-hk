import { Router } from 'express'
import { findAllQuests, findQuestById } from '../models/Quest.js'
import { findAllCities } from '../models/City.js'
import { requireAuth } from '../middleware/auth.js'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const city = req.query.city || undefined
    res.json(await findAllQuests({ status: 'published', city, withSteps: false }))
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/:id', async (req, res) => {
  try {
    const quest = await findQuestById(req.params.id, false)
    if (!quest) return res.status(404).json({ error: 'Not found' })
    res.json(quest)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/:id/reviews', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id, r.rating, r.text, r.photos, r.created_at,
             u.email AS user_email
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.quest_id = $1 AND r.approved = true
      ORDER BY r.created_at DESC
    `, [req.params.id])
    res.json(rows.map(r => ({
      id: r.id, rating: r.rating, text: r.text,
      photos: r.photos || [], createdAt: r.created_at, userEmail: r.user_email,
    })))
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/:id/steps', requireAuth, async (req, res) => {
  try {
    const questId = req.params.id
    const hasPurchased = req.user.purchasedQuests.includes(questId)
    if (!hasPurchased && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Purchase required' })
    }
    const quest = await findQuestById(questId, true)
    if (!quest) return res.status(404).json({ error: 'Not found' })
    res.json(quest.steps.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id)))
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id/progress', requireAuth, async (req, res) => {
  try {
    const { current, total } = req.body
    await pool.query(
      'UPDATE user_quests SET progress = $1 WHERE user_id = $2 AND quest_id = $3',
      [JSON.stringify({ current, total }), req.user.id, req.params.id]
    )
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/:id/complete', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE user_quests SET completed = TRUE, progress = NULL WHERE user_id = $1 AND quest_id = $2',
      [req.user.id, req.params.id]
    )
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/:id/progress', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT progress, completed FROM user_quests WHERE user_id = $1 AND quest_id = $2',
      [req.user.id, req.params.id]
    )
    if (!rows.length) return res.json({ progress: null, completed: false })
    res.json({ progress: rows[0].progress, completed: rows[0].completed })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/cities', async (_, res) => {
  try {
    res.json(await findAllCities())
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
