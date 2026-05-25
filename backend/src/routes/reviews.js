import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { createReview, findApprovedReviews } from '../models/Review.js'
import { uploadFile } from '../storage.js'
import { broadcast } from '../events.js'
import { pool } from '../db.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 4 },
  fileFilter: (_, file, cb) => cb(null, file.mimetype.startsWith('image/')),
})

router.get('/', async (_, res) => {
  try {
    res.json(await findApprovedReviews())
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/', requireAuth, upload.array('photos', 4), async (req, res) => {
  try {
    const { questId, rating, text } = req.body
    if (!questId || !rating || !text) return res.status(400).json({ error: 'Missing fields' })

    const hasPurchased = req.user.purchasedQuests.includes(questId)
    if (!hasPurchased && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Purchase required' })
    }

    const photos = await Promise.all(
      (req.files || []).map(f => uploadFile(f.buffer, f.mimetype, 'reviews'))
    )
    const review = await createReview({ userId: req.user.id, questId, rating: parseInt(rating), text, photos })
    broadcast('review', { message: `Новый отзыв (${rating}★)`, questId })
    res.status(201).json(review)
  } catch (err) {
    console.error('review error:', err?.message || err)
    if (err?.message?.includes('mime type') || err?.message?.includes('not supported')) {
      return res.status(400).json({ error: 'Unsupported image format. Use JPG, PNG or WebP.' })
    }
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Review already exists' })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT 1 FROM review_votes WHERE user_id = $1 AND review_id = $2',
      [req.user.id, req.params.id]
    )
    if (rows.length > 0) {
      await pool.query(
        'DELETE FROM review_votes WHERE user_id = $1 AND review_id = $2',
        [req.user.id, req.params.id]
      )
      res.json({ voted: false })
    } else {
      await pool.query(
        'INSERT INTO review_votes (user_id, review_id) VALUES ($1, $2)',
        [req.user.id, req.params.id]
      )
      res.json({ voted: true })
    }
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
