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

router.get('/events', (req, res) => {
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

export default router
