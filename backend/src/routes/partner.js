import { Router } from 'express'
import multer from 'multer'
import { requireAuth, requirePartner } from '../middleware/auth.js'
import { findQuestById, createQuest, updateQuest, deleteQuest } from '../models/Quest.js'
import { pool } from '../db.js'
import { uploadFile } from '../storage.js'

const router = Router()
router.use(requireAuth, requirePartner)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(null, file.mimetype.startsWith('image/')),
})

function toRow(r) {
  return {
    _id: r.id, id: r.id, title: r.title, description: r.description,
    duration: r.duration, distance: r.distance, difficulty: r.difficulty,
    price: parseFloat(r.price), currency: r.currency, city: r.city,
    status: r.status, coverImage: r.cover_image, galleryImages: r.gallery_images || [],
    locationsCount: r.locations_count, questionsCount: r.questions_count,
    transportCost: r.transport_cost, startPoint: r.start_point, endPoint: r.end_point,
    rating: parseFloat(r.real_rating ?? r.rating),
    completedCount: parseInt(r.real_completed ?? 0),
    reviewCount: parseInt(r.review_count ?? 0),
    partnerId: r.partner_id,
    steps: r.steps || [],
  }
}

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const pid = req.user.id
    const [q, e, s, profile] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM quests WHERE partner_id = $1', [pid]),
      pool.query('SELECT COALESCE(SUM(amount),0)::numeric AS t FROM partner_earnings WHERE partner_id = $1', [pid]),
      pool.query('SELECT COUNT(*)::int AS c FROM partner_earnings WHERE partner_id = $1', [pid]),
      pool.query('SELECT payout_percent, business_name FROM partner_profiles WHERE user_id = $1', [pid]),
    ])
    res.json({
      quests: q.rows[0].c,
      totalEarned: parseFloat(e.rows[0].t),
      totalSales: s.rows[0].c,
      payoutPercent: profile.rows[0]?.payout_percent ?? 70,
      businessName: profile.rows[0]?.business_name ?? null,
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// List own quests
router.get('/quests', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT q.*,
        (SELECT COUNT(*)::int FROM user_quests WHERE quest_id = q.id) AS real_completed,
        COALESCE((SELECT AVG(rating) FROM reviews WHERE quest_id = q.id AND approved=true), q.rating) AS real_rating,
        (SELECT COUNT(*)::int FROM reviews WHERE quest_id = q.id AND approved=true) AS review_count
      FROM quests q
      WHERE q.partner_id = $1
      ORDER BY q.created_at DESC
    `, [req.user.id])
    res.json(rows.map(toRow))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get single quest (own)
router.get('/quests/:id', async (req, res) => {
  try {
    const quest = await findQuestById(req.params.id)
    if (!quest) return res.status(404).json({ error: 'Not found' })
    if (quest.partnerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    res.json(quest)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Create quest
router.post('/quests', async (req, res) => {
  try {
    const quest = await createQuest({ ...req.body, partnerId: req.user.id, status: 'draft' })
    res.status(201).json(quest)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update quest (own only)
router.patch('/quests/:id', async (req, res) => {
  try {
    const existing = await findQuestById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.partnerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    // Partner cannot publish directly — stays draft or pending
    const data = { ...req.body }
    if (req.user.role !== 'admin' && data.status === 'published') data.status = 'pending'
    const quest = await updateQuest(req.params.id, data)
    res.json(quest)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Upload cover image (own quest)
router.post('/quests/:id/cover', upload.single('image'), async (req, res) => {
  try {
    const existing = await findQuestById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.partnerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    if (!req.file) return res.status(400).json({ error: 'No file' })
    const url = await uploadFile(req.file.buffer, req.file.mimetype, 'covers')
    const quest = await updateQuest(req.params.id, { coverImage: url })
    res.json({ coverImage: quest.coverImage })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Delete quest (own, only drafts/pending)
router.delete('/quests/:id', async (req, res) => {
  try {
    const existing = await findQuestById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.partnerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    if (existing.status === 'published' && req.user.role !== 'admin') return res.status(403).json({ error: 'Cannot delete published quest' })
    await deleteQuest(req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Upload step image (own quest)
router.post('/quests/:id/step-image', upload.single('image'), async (req, res) => {
  try {
    const existing = await findQuestById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.partnerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    if (!req.file) return res.status(400).json({ error: 'No file' })
    const url = await uploadFile(req.file.buffer, req.file.mimetype, 'steps')
    res.json({ url })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Save steps (own quest)
router.put('/quests/:id/steps', async (req, res) => {
  try {
    const existing = await findQuestById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.partnerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const quest = await updateQuest(req.params.id, { steps: req.body })
    res.json(quest?.steps ?? [])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Earnings history
router.get('/earnings', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT pe.id, pe.amount, pe.total_price, pe.paid_out, pe.created_at,
             q.title AS quest_title, u.email AS buyer_email
      FROM partner_earnings pe
      LEFT JOIN quests q ON q.id = pe.quest_id
      LEFT JOIN users u ON u.id = pe.buyer_id
      WHERE pe.partner_id = $1
      ORDER BY pe.created_at DESC
      LIMIT 100
    `, [req.user.id])
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
