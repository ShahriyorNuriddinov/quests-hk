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
  // Auto-unpublish partner quest if avg rating drops below 4.0 after approval
  if (req.body.approved && r?.quest?.id) {
    checkPartnerQuestRating(r.quest.id).catch(() => {})
  }
  res.json(r)
})

async function checkPartnerQuestRating(questId) {
  const { rows } = await pool.query(
    'SELECT AVG(rating)::float AS avg, COUNT(*)::int AS cnt FROM reviews WHERE quest_id = $1 AND approved = true',
    [questId]
  )
  const { avg, cnt } = rows[0]
  if (avg !== null && cnt >= 2 && avg < 4.0) {
    const { rows: qr } = await pool.query(
      "SELECT partner_id, status, title FROM quests WHERE id = $1", [questId]
    )
    if (qr[0]?.partner_id && qr[0]?.status === 'published') {
      await pool.query(
        "UPDATE quests SET status = 'pending', updated_at = NOW() WHERE id = $1", [questId]
      )
      broadcast('review', {
        message: `⚠️ Квест «${qr[0].title}» снят с публикации (рейтинг ${avg.toFixed(1)} < 4.0)`
      })
    }
  }
}

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

// ── Partner management ──────────────────────────────────────────
router.get('/partners', async (_, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.display_name, u.created_at,
             pp.business_name, pp.payout_percent, pp.payout_details,
             (SELECT COUNT(*)::int FROM partner_earnings WHERE partner_id = u.id) AS total_sales,
             (SELECT COALESCE(SUM(amount),0)::numeric FROM partner_earnings WHERE partner_id = u.id) AS total_earned,
             (SELECT COALESCE(SUM(amount),0)::numeric FROM partner_earnings WHERE partner_id = u.id AND paid_out = false) AS unpaid_amount
      FROM users u
      LEFT JOIN partner_profiles pp ON pp.user_id = u.id
      WHERE u.role = 'partner'
      ORDER BY u.created_at DESC
    `)
    res.json(rows.map(r => ({
      id: r.id, email: r.email, displayName: r.display_name,
      businessName: r.business_name, payoutPercent: r.payout_percent ?? 70,
      payoutDetails: r.payout_details,
      totalSales: r.total_sales, totalEarned: parseFloat(r.total_earned),
      unpaidAmount: parseFloat(r.unpaid_amount),
      createdAt: r.created_at,
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Add partner (by email)
router.post('/partners', async (req, res) => {
  try {
    const { email, payoutPercent = 70, businessName = '' } = req.body
    if (!email) return res.status(400).json({ error: 'email required' })
    const { rows: uRows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (!uRows.length) return res.status(404).json({ error: 'Пользователь не найден' })
    const userId = uRows[0].id
    await pool.query("UPDATE users SET role = 'partner' WHERE id = $1", [userId])
    await pool.query(
      'INSERT INTO partner_profiles (user_id, business_name, payout_percent) VALUES ($1,$2,$3) ON CONFLICT (user_id) DO UPDATE SET business_name=$2, payout_percent=$3',
      [userId, businessName, payoutPercent]
    )
    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.display_name, u.created_at,
             pp.business_name, pp.payout_percent, pp.payout_details
      FROM users u LEFT JOIN partner_profiles pp ON pp.user_id = u.id
      WHERE u.id = $1`, [userId])
    const r = rows[0]
    res.json({
      id: r.id, email: r.email, displayName: r.display_name,
      businessName: r.business_name, payoutPercent: r.payout_percent ?? 70,
      payoutDetails: r.payout_details, totalSales: 0, totalEarned: 0, unpaidAmount: 0,
      createdAt: r.created_at,
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update partner profile
router.patch('/partners/:userId', async (req, res) => {
  try {
    const { payoutPercent, businessName, payoutDetails } = req.body
    const sets = []
    const vals = [req.params.userId]
    if (payoutPercent !== undefined) { sets.push(`payout_percent = $${vals.length+1}`); vals.push(payoutPercent) }
    if (businessName !== undefined) { sets.push(`business_name = $${vals.length+1}`); vals.push(businessName) }
    if (payoutDetails !== undefined) { sets.push(`payout_details = $${vals.length+1}`); vals.push(payoutDetails) }
    if (sets.length) {
      await pool.query(
        `INSERT INTO partner_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET ${sets.join(', ')}`,
        vals
      )
    }
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Remove partner role
router.delete('/partners/:userId', async (req, res) => {
  try {
    await pool.query("UPDATE users SET role = 'user' WHERE id = $1", [req.params.userId])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Partner earnings list (admin view)
router.get('/partners/:userId/earnings', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT pe.id, pe.amount, pe.total_price, pe.paid_out, pe.created_at,
             q.title AS quest_title, u.email AS buyer_email
      FROM partner_earnings pe
      LEFT JOIN quests q ON q.id = pe.quest_id
      LEFT JOIN users u ON u.id = pe.buyer_id
      WHERE pe.partner_id = $1
      ORDER BY pe.created_at DESC
    `, [req.params.userId])
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Mark earnings as paid out
router.post('/partners/:userId/payout', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE partner_earnings SET paid_out = true WHERE partner_id = $1 AND paid_out = false RETURNING amount',
      [req.params.userId]
    )
    const total = rows.reduce((s, r) => s + parseFloat(r.amount), 0)
    res.json({ ok: true, paid: total })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Publish/unpublish partner quest (admin approval)
router.patch('/partners/quests/:questId/status', async (req, res) => {
  try {
    const { status } = req.body
    await pool.query('UPDATE quests SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.questId])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Achievements CRUD ───────────────────────────────────────────
function toAchievement(r) {
  return {
    code: r.code, title: r.title, emoji: r.emoji,
    description: r.description, conditionType: r.condition_type,
    conditionValue: r.condition_value, active: r.active, sortOrder: r.sort_order,
  }
}

router.get('/achievements', async (_, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM achievements ORDER BY sort_order ASC')
    res.json(rows.map(toAchievement))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/achievements', async (req, res) => {
  try {
    const { code, title, emoji = '🏆', description = '', conditionType = 'completed_gte', conditionValue = 1, sortOrder = 0 } = req.body
    if (!code || !title) return res.status(400).json({ error: 'code and title required' })
    const { rows } = await pool.query(
      `INSERT INTO achievements (code, title, emoji, description, condition_type, condition_value, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [code.toLowerCase().replace(/\s+/g, '_'), title, emoji, description, conditionType, conditionValue || null, sortOrder]
    )
    res.status(201).json(toAchievement(rows[0]))
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Code already exists' })
    res.status(500).json({ error: err.message })
  }
})

router.patch('/achievements/:code', async (req, res) => {
  try {
    const { title, emoji, description, conditionType, conditionValue, active, sortOrder } = req.body
    const colMap = { title, emoji, description, condition_type: conditionType, condition_value: conditionValue, active, sort_order: sortOrder }
    const sets = []; const vals = [req.params.code]
    for (const [col, val] of Object.entries(colMap)) {
      if (val !== undefined) { sets.push(`${col} = $${vals.length + 1}`); vals.push(val) }
    }
    if (!sets.length) return res.json({ ok: true })
    const { rows } = await pool.query(
      `UPDATE achievements SET ${sets.join(', ')} WHERE code = $1 RETURNING *`, vals
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(toAchievement(rows[0]))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/achievements/:code', async (req, res) => {
  try {
    await pool.query('DELETE FROM achievements WHERE code = $1', [req.params.code])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
