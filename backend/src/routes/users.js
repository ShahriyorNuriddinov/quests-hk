import { Router } from 'express'
import { findQuestsByIds } from '../models/Quest.js'
import { findUserById } from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { pool } from '../db.js'

const router = Router()

async function getAchievements() {
  const { rows } = await pool.query('SELECT * FROM achievements WHERE active = true ORDER BY sort_order ASC')
  return rows
}

router.get('/my-quests', requireAuth, async (req, res) => {
  try {
    const ids = req.user.purchasedQuests
    if (!ids.length) return res.json([])
    const [quests, progressRows] = await Promise.all([
      findQuestsByIds(ids, false),
      pool.query(
        'SELECT quest_id, progress, completed FROM user_quests WHERE user_id = $1',
        [req.user.id]
      ),
    ])
    const progMap = Object.fromEntries(progressRows.rows.map(r => [r.quest_id, r]))
    res.json(quests.map(q => ({
      ...q,
      progress: progMap[q._id]?.progress ?? null,
      completed: progMap[q._id]?.completed ?? false,
    })))
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { displayName, avatarColor } = req.body
    await pool.query(
      `UPDATE users SET
        display_name = CASE WHEN $1::text IS NOT NULL THEN $1 ELSE display_name END,
        avatar_color = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE avatar_color END,
        updated_at = NOW()
       WHERE id = $3`,
      [displayName ?? null, avatarColor ?? null, req.user.id]
    )
    const user = await findUserById(req.user.id)
    res.json({
      id: user.id, email: user.email, role: user.role,
      purchasedQuests: user.purchasedQuests,
      displayName: user.displayName, avatarColor: user.avatarColor,
    })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const [defs, earned] = await Promise.all([
      getAchievements(),
      pool.query('SELECT code, earned_at FROM user_achievements WHERE user_id = $1', [req.user.id]),
    ])
    const earnedMap = Object.fromEntries(earned.rows.map(r => [r.code, r.earned_at]))
    res.json(defs.map(a => ({
      code: a.code, title: a.title, emoji: a.emoji, desc: a.description,
      earned: a.code in earnedMap, earnedAt: earnedMap[a.code] || null,
    })))
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/achievements/check', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const [defs, completed, purchases, photos, reviews, existing] = await Promise.all([
      getAchievements(),
      pool.query('SELECT COUNT(*)::int AS c FROM user_quests WHERE user_id = $1 AND completed = TRUE', [userId]),
      pool.query('SELECT COUNT(*)::int AS c FROM user_quests WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*)::int AS c FROM quest_photos WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*)::int AS c FROM reviews WHERE user_id = $1', [userId]),
      pool.query('SELECT code FROM user_achievements WHERE user_id = $1', [userId]),
    ])
    const completedCount = completed.rows[0].c
    const purchaseCount = purchases.rows[0].c
    const hasPhotos = photos.rows[0].c > 0
    const hasReview = reviews.rows[0].c > 0
    const existingSet = new Set(existing.rows.map(r => r.code))

    const toAward = []
    for (const a of defs) {
      if (existingSet.has(a.code)) continue
      const val = a.condition_value
      if (a.condition_type === 'completed_gte' && completedCount >= val) toAward.push(a)
      else if (a.condition_type === 'purchased_gte' && purchaseCount >= val) toAward.push(a)
      else if (a.condition_type === 'has_photo' && hasPhotos) toAward.push(a)
      else if (a.condition_type === 'has_review' && hasReview) toAward.push(a)
    }

    if (toAward.length > 0) {
      const vals = toAward.map((_, i) => `($1, $${i + 2})`).join(', ')
      await pool.query(
        `INSERT INTO user_achievements (user_id, code) VALUES ${vals} ON CONFLICT DO NOTHING`,
        [userId, ...toAward.map(a => a.code)]
      )
    }

    res.json({ new: toAward.map(a => ({ code: a.code, title: a.title, emoji: a.emoji, desc: a.description })) })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/notify-city', async (req, res) => {
  try {
    const { email, cityCode } = req.body
    if (!email || !cityCode) return res.status(400).json({ error: 'Missing fields' })
    await pool.query(
      'INSERT INTO city_notifications (email, city_code) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [email.toLowerCase(), cityCode]
    )
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
