import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { upsertUserByEmail, findUserById } from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
)

const router = Router()

router.post('/supabase-sync', async (req, res) => {
  try {
    const { access_token } = req.body
    if (!access_token) return res.status(400).json({ error: 'Missing token' })
    const { data: { user: sbUser }, error } = await supabase.auth.getUser(access_token)
    if (error || !sbUser) return res.status(401).json({ error: 'Invalid token' })
    const created = await upsertUserByEmail(sbUser.email)
    const user = await findUserById(created.id)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '90d' })
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, purchasedQuests: user.purchasedQuests, displayName: user.displayName, avatarColor: user.avatarColor } })
  } catch (err) {
    console.error('supabase-sync error:', err)
    res.status(500).json({ error: 'Auth error' })
  }
})

router.get('/me', requireAuth, (req, res) => {
  const { id, email, role, purchasedQuests, displayName, avatarColor } = req.user
  res.json({ id, email, role, purchasedQuests, displayName, avatarColor })
})

export default router
