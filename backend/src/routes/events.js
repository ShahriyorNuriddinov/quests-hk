import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (_, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, text, image_url FROM events WHERE active = true ORDER BY sort_order ASC, created_at DESC'
    )
    res.json(rows.map(r => ({ id: r.id, title: r.title, text: r.text, imageUrl: r.image_url })))
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
