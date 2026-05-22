import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { initDb } from './db.js'

import authRoutes from './routes/auth.js'
import questRoutes from './routes/quests.js'
import userRoutes from './routes/users.js'
import paymentRoutes from './routes/payments.js'
import adminRoutes from './routes/admin.js'
import reviewRoutes from './routes/reviews.js'

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET env variable is not set')
  process.exit(1)
}

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }), authRoutes)
app.use('/api/quests', questRoutes)
app.use('/api/users', userRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reviews', reviewRoutes)

const PORT = process.env.PORT || 4000

initDb()
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch(err => { console.error('DB init error:', err); process.exit(1) })
