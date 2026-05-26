import { Router } from 'express'
import multer from 'multer'
import nodemailer from 'nodemailer'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { subscribe, broadcast } from '../events.js'
import { findAllQuests, findQuestById, createQuest, updateQuest, deleteQuest, countQuests } from '../models/Quest.js'
import { countUsers, countTotalPurchases, findAllUsers, findAllSales, getTotalRevenue, getSalesChart } from '../models/User.js'
import { findAllReviews, updateReview, deleteReview, countReviews } from '../models/Review.js'
import { findAllPromoCodes, createPromoCode, updatePromoCode, countActivePromoCodes, payoutPromo } from '../models/PromoCode.js'
import { findAllCities, updateCity, createCity, deleteCity } from '../models/City.js'
import { pool } from '../db.js'
import { uploadFile } from '../storage.js'

const router = Router()
router.use(requireAuth, requireAdmin)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(null, file.mimetype.startsWith('image/')),
})

router.get('/stats', async (_, res) => {
  const [users, quests, reviews, sales, promoCodes, revenue] = await Promise.all([
    countUsers('user'),
    countQuests('published'),
    countReviews(),
    countTotalPurchases(),
    countActivePromoCodes(),
    getTotalRevenue(),
  ])
  res.json({ sales, promoCodes, payouts: revenue, users, completedQuests: sales, reviews })
})

router.get('/users', async (_, res) => {
  res.json(await findAllUsers())
})

router.get('/sales', async (_, res) => {
  res.json(await findAllSales())
})

router.get('/sales/chart', async (_, res) => {
  res.json(await getSalesChart())
})

router.get('/quests', async (_, res) => {
  res.json(await findAllQuests({ withSteps: false }))
})

router.get('/quests/:id', async (req, res) => {
  const q = await findQuestById(req.params.id)
  if (!q) return res.status(404).json({ error: 'Not found' })
  res.json(q)
})

router.post('/quests', async (req, res) => {
  const quest = await createQuest(req.body)
  res.status(201).json(quest)
})

router.put('/quests/:id', async (req, res) => {
  const quest = await updateQuest(req.params.id, req.body)
  if (!quest) return res.status(404).json({ error: 'Not found' })
  res.json(quest)
})

router.delete('/quests/:id', async (req, res) => {
  await deleteQuest(req.params.id)
  res.json({ ok: true })
})

router.post('/quests/:id/cover', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  try {
    const url = await uploadFile(req.file.buffer, req.file.mimetype, 'covers')
    await updateQuest(req.params.id, { coverImage: url })
    res.json({ url })
  } catch (e) {
    console.error('cover upload error:', e)
    res.status(500).json({ error: 'Upload failed' })
  }
})

router.post('/quests/:id/step-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  try {
    const url = await uploadFile(req.file.buffer, req.file.mimetype, 'steps')
    res.json({ url })
  } catch (e) {
    console.error('step image upload error:', e)
    res.status(500).json({ error: 'Upload failed' })
  }
})

router.put('/quests/:id/steps', async (req, res) => {
  try {
    const quest = await updateQuest(req.params.id, { steps: req.body })
    res.json(quest?.steps ?? [])
  } catch (e) {
    console.error('steps save error:', e)
    res.status(500).json({ error: 'Failed to save steps' })
  }
})

router.post('/notify', async (req, res) => {
  const { subject, message } = req.body
  if (!subject || !message) return res.status(400).json({ error: 'Missing fields' })

  const { rows } = await pool.query("SELECT email FROM users WHERE role = 'user'")

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
  })

  let sent = 0
  for (const { email } of rows) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject,
        html: `<div style="font-family:sans-serif;max-width:500px;padding:24px">
          <h2 style="color:#FFD600;margin:0 0 16px">QUESTS HK</h2>
          <div style="font-size:15px;line-height:1.6;white-space:pre-line;color:#333">${message}</div>
          <p style="margin-top:32px">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}"
               style="background:#FFD600;color:#000;padding:12px 24px;border-radius:12px;font-weight:bold;text-decoration:none">
              Открыть приложение
            </a>
          </p>
        </div>`,
      })
      sent++
    } catch {}
  }

  res.json({ ok: true, sent })
})

router.get('/reviews', async (_, res) => {
  res.json(await findAllReviews())
})

router.patch('/reviews/:id', async (req, res) => {
  const r = await updateReview(req.params.id, req.body)
  res.json(r)
})

router.delete('/reviews/:id', async (req, res) => {
  await deleteReview(req.params.id)
  res.json({ ok: true })
})

router.get('/promo', async (_, res) => {
  try {
    res.json(await findAllPromoCodes())
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/promo', async (req, res) => {
  try {
    const promo = await createPromoCode(req.body)
    res.status(201).json(promo)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/promo/:id', async (req, res) => {
  try {
    const promo = await updatePromoCode(req.params.id, req.body)
    res.json(promo)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/promo/:id/payout', async (req, res) => {
  try {
    const promo = await payoutPromo(req.params.id)
    if (!promo) return res.status(404).json({ error: 'Not found' })
    res.json(promo)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Cities ─────────────────────────────────────────────────────
router.get('/cities', async (_, res) => {
  try {
    res.json(await findAllCities())
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/cities', async (req, res) => {
  try {
    const city = await createCity(req.body)
    res.status(201).json(city)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/cities/:id', async (req, res) => {
  try {
    const city = await updateCity(req.params.id, req.body)
    res.json(city)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/cities/:id', async (req, res) => {
  try {
    await deleteCity(req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/stream', (req, res) => {
  if (req.socket) req.socket.setNoDelay(true)
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('data: {"type":"connected"}\n\n')
  console.log('[SSE] admin client connected, total:', /* will be set after subscribe */ 0)

  const unsub = subscribe(res)

  const ping = setInterval(() => {
    try { res.write(': ping\n\n') }
    catch { clearInterval(ping); unsub() }
  }, 20000)

  req.on('close', () => {
    console.log('[SSE] admin client disconnected')
    clearInterval(ping)
    unsub()
  })
})

router.post('/test-notif', (req, res) => {
  const { type = 'purchase', message = 'Тест уведомление' } = req.body
  broadcast(type, { message })
  res.json({ ok: true })
})

// ─── Events CRUD ───────────────────────────────────────────────────────────

function toEvent(r) {
  return { id: r.id, title: r.title, text: r.text, imageUrl: r.image_url, active: r.active, sortOrder: r.sort_order, createdAt: r.created_at }
}

router.get('/events', async (_, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM events ORDER BY sort_order ASC, created_at DESC')
    res.json(rows.map(toEvent))
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/events', upload.single('image'), async (req, res) => {
  try {
    const { title, text = '', sortOrder = 0 } = req.body
    if (!title) return res.status(400).json({ error: 'Missing title' })
    let imageUrl = null
    if (req.file) imageUrl = await uploadFile(req.file.buffer, req.file.mimetype, 'events')
    const { rows } = await pool.query(
      'INSERT INTO events (title, text, image_url, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, text || null, imageUrl, parseInt(sortOrder) || 0]
    )
    res.status(201).json(toEvent(rows[0]))
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/events/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, text, active, sortOrder } = req.body
    let imageUrl = req.body.imageUrl ?? null
    if (req.file) imageUrl = await uploadFile(req.file.buffer, req.file.mimetype, 'events')
    const { rows } = await pool.query(
      `UPDATE events SET
        title      = COALESCE($1, title),
        text       = COALESCE($2, text),
        image_url  = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE image_url END,
        active     = CASE WHEN $4::text IS NOT NULL THEN ($4 = 'true') ELSE active END,
        sort_order = COALESCE($5::int, sort_order),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title ?? null, text ?? null, imageUrl, active ?? null, sortOrder ? parseInt(sortOrder) : null, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(toEvent(rows[0]))
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/events/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
