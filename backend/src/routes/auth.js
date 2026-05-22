import { Router } from 'express'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { findUserByEmail, upsertUserByEmail, clearUserOtp } from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
})

router.post('/send-code', async (req, res) => {
  const { email } = req.body
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' })

  const otp = generateOTP()
  const expires = new Date(Date.now() + 10 * 60 * 1000)

  await upsertUserByEmail(email, { otpCode: otp, otpExpires: expires })

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Ваш код для входа — QUESTS HK',
      html: `<div style="font-family:sans-serif;max-width:400px">
        <h2 style="color:#FFD600">QUESTS HK</h2>
        <p>Ваш код для входа:</p>
        <h1 style="letter-spacing:8px;font-size:36px">${otp}</h1>
        <p style="color:#999;font-size:12px">Код действует 10 минут</p>
      </div>`,
    })
  } catch (err) {
    console.error('Email error:', err)
    if (process.env.NODE_ENV !== 'production') console.log(`OTP for ${email}: ${otp}`)
  }

  res.json({ ok: true })
})

router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body
  const user = await findUserByEmail(email)

  if (!user || user.otpCode !== code || new Date(user.otpExpires) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired code' })
  }

  await clearUserOtp(user.id)

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '90d' })
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, purchasedQuests: user.purchasedQuests } })
})

router.get('/me', requireAuth, (req, res) => {
  const { id, email, role, purchasedQuests } = req.user
  res.json({ id, email, role, purchasedQuests })
})

export default router
