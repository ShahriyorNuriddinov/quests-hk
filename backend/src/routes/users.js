import { Router } from 'express'
import { findQuestsByIds } from '../models/Quest.js'
import { requireAuth } from '../middleware/auth.js'
import { pool } from '../db.js'

const router = Router()

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

export default router
