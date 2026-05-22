import { pool } from '../db.js'

function toUser(row) {
  if (!row) return null
  return {
    id: row.id,
    _id: row.id,
    email: row.email,
    role: row.role,
    otpCode: row.otp_code,
    otpExpires: row.otp_expires,
    purchasedQuests: row.purchased_quests || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const WITH_QUESTS = `
  SELECT u.*, COALESCE(array_agg(uq.quest_id::text) FILTER (WHERE uq.quest_id IS NOT NULL), '{}') AS purchased_quests
  FROM users u
  LEFT JOIN user_quests uq ON uq.user_id = u.id
`

export async function findUserById(id) {
  const { rows } = await pool.query(`${WITH_QUESTS} WHERE u.id = $1 GROUP BY u.id`, [id])
  return toUser(rows[0])
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query(`${WITH_QUESTS} WHERE u.email = $1 GROUP BY u.id`, [email.toLowerCase()])
  return toUser(rows[0])
}

export async function upsertUserByEmail(email, { otpCode, otpExpires }) {
  const { rows } = await pool.query(`
    INSERT INTO users (email, otp_code, otp_expires)
    VALUES ($1, $2, $3)
    ON CONFLICT (email) DO UPDATE SET
      otp_code = $2,
      otp_expires = $3,
      updated_at = NOW()
    RETURNING *
  `, [email.toLowerCase(), otpCode, otpExpires])
  return toUser(rows[0])
}

export async function clearUserOtp(id) {
  await pool.query(
    'UPDATE users SET otp_code = NULL, otp_expires = NULL, updated_at = NOW() WHERE id = $1',
    [id]
  )
}

export async function addPurchasedQuest(userId, questId) {
  await pool.query(
    'INSERT INTO user_quests (user_id, quest_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, questId]
  )
}

export async function findAllUsers() {
  const { rows } = await pool.query(`
    ${WITH_QUESTS}
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `)
  return rows.map(toUser)
}

export async function findAllSales() {
  const { rows } = await pool.query(`
    SELECT uq.user_id, uq.quest_id, u.email, q.title, q.price, q.currency, uq.purchased_at
    FROM user_quests uq
    JOIN users u ON u.id = uq.user_id
    JOIN quests q ON q.id = uq.quest_id
    ORDER BY uq.purchased_at DESC
  `)
  return rows.map(r => ({
    userId: r.user_id,
    questId: r.quest_id,
    email: r.email,
    questTitle: r.title,
    price: parseFloat(r.price),
    currency: r.currency,
    purchasedAt: r.purchased_at,
  }))
}

export async function getTotalRevenue() {
  const { rows } = await pool.query(`
    SELECT COALESCE(SUM(q.price), 0) as total
    FROM user_quests uq
    JOIN quests q ON q.id = uq.quest_id
  `)
  return parseFloat(rows[0].total)
}

export async function countUsers(role = 'user') {
  const { rows } = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', [role])
  return parseInt(rows[0].count)
}

export async function countTotalPurchases() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM user_quests')
  return parseInt(rows[0].count)
}

export async function getSalesChart() {
  const [byDay, byQuest] = await Promise.all([
    pool.query(`
      SELECT
        TO_CHAR(uq.purchased_at, 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS sales,
        SUM(q.price)::numeric AS revenue
      FROM user_quests uq
      JOIN quests q ON q.id = uq.quest_id
      WHERE uq.purchased_at >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day
    `),
    pool.query(`
      SELECT q.title, COUNT(*)::int AS sales, SUM(q.price)::numeric AS revenue
      FROM user_quests uq
      JOIN quests q ON q.id = uq.quest_id
      GROUP BY q.id, q.title
      ORDER BY revenue DESC
    `),
  ])
  return {
    byDay: byDay.rows.map(r => ({ day: r.day, sales: r.sales, revenue: parseFloat(r.revenue) })),
    byQuest: byQuest.rows.map(r => ({ title: r.title, sales: r.sales, revenue: parseFloat(r.revenue) })),
  }
}
