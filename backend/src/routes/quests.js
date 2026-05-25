import { Router } from 'express'
import multer from 'multer'
import { findAllQuests, findQuestById } from '../models/Quest.js'
import { findAllCities } from '../models/City.js'
import { requireAuth } from '../middleware/auth.js'
import { pool } from '../db.js'
import { uploadFile } from '../storage.js'

const router = Router()

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(null, file.mimetype.startsWith('image/')),
})

router.get('/', async (req, res) => {
  try {
    const city = req.query.city || undefined
    res.json(await findAllQuests({ status: 'published', city, withSteps: false }))
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/cities', async (_, res) => {
  try {
    res.json(await findAllCities())
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
    const userId = req.query.userId || null
    const { rows } = await pool.query(`
      SELECT r.id, r.rating, r.text, r.photos, r.created_at,
             u.email AS user_email,
             u.display_name AS user_display_name,
             COUNT(rv.user_id)::int AS helpful_count,
             ${userId ? 'MAX(CASE WHEN rv.user_id = $2::uuid THEN 1 ELSE 0 END)::boolean AS voted_by_me' : 'false AS voted_by_me'}
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN review_votes rv ON rv.review_id = r.id
      WHERE r.quest_id = $1 AND r.approved = true
      GROUP BY r.id, u.email, u.display_name
      ORDER BY helpful_count DESC, r.created_at DESC
    `, userId ? [req.params.id, userId] : [req.params.id])
    res.json(rows.map(r => ({
      id: r.id, rating: r.rating, text: r.text,
      photos: r.photos || [], createdAt: r.created_at,
      userEmail: r.user_email,
      userDisplayName: r.user_display_name || null,
      helpfulCount: r.helpful_count,
      votedByMe: r.voted_by_me,
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

router.post('/:id/photos', requireAuth, photoUpload.single('photo'), async (req, res) => {
  try {
    const { stepIndex = 0 } = req.body
    if (!req.file) return res.status(400).json({ error: 'No file' })
    const url = await uploadFile(req.file.buffer, req.file.mimetype, 'quest-photos')
    await pool.query(
      'INSERT INTO quest_photos (user_id, quest_id, step_index, photo_url) VALUES ($1, $2, $3, $4)',
      [req.user.id, req.params.id, parseInt(stepIndex) || 0, url]
    )
    res.json({ url })
  } catch (err) {
    console.error('quest photo upload error:', err?.message || err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

router.get('/:id/photos', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT step_index, photo_url FROM quest_photos WHERE user_id = $1 AND quest_id = $2 ORDER BY step_index, created_at',
      [req.user.id, req.params.id]
    )
    res.json(rows.map(r => ({ stepIndex: r.step_index, url: r.photo_url })))
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
