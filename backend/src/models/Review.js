import { pool } from '../db.js'

function toReview(row) {
  if (!row) return null
  return {
    id: row.id,
    _id: row.id,
    user: { id: row.user_id, _id: row.user_id, email: row.user_email },
    quest: { id: row.quest_id, _id: row.quest_id, title: row.quest_title },
    rating: row.rating,
    text: row.text,
    photos: row.photos || [],
    approved: row.approved,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function findAllReviews() {
  const { rows } = await pool.query(`
    SELECT r.*, u.email AS user_email, q.title AS quest_title
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN quests q ON q.id = r.quest_id
    ORDER BY r.created_at DESC
  `)
  return rows.map(toReview)
}

export async function findApprovedReviews() {
  const { rows } = await pool.query(`
    SELECT r.*, u.email AS user_email, q.title AS quest_title
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN quests q ON q.id = r.quest_id
    WHERE r.approved = true
    ORDER BY r.created_at DESC
  `)
  return rows.map(toReview)
}

export async function createReview(data) {
  const { rows } = await pool.query(`
    INSERT INTO reviews (user_id, quest_id, rating, text, photos)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `, [data.userId, data.questId, data.rating, data.text, JSON.stringify(data.photos || [])])
  return toReview(rows[0])
}

export async function updateReview(id, data) {
  const sets = []
  const vals = []
  let i = 1
  if (data.approved !== undefined) { sets.push(`approved = $${i++}`); vals.push(data.approved) }
  if (data.text !== undefined) { sets.push(`text = $${i++}`); vals.push(data.text) }
  if (data.rating !== undefined) { sets.push(`rating = $${i++}`); vals.push(data.rating) }
  if (!sets.length) return null
  sets.push(`updated_at = NOW()`)
  vals.push(id)
  await pool.query(
    `UPDATE reviews SET ${sets.join(', ')} WHERE id = $${i}`,
    vals
  )
  const { rows: updated } = await pool.query(`
    SELECT r.*, u.email AS user_email, q.title AS quest_title
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN quests q ON q.id = r.quest_id
    WHERE r.id = $1
  `, [id])
  return toReview(updated[0])
}

export async function deleteReview(id) {
  await pool.query('DELETE FROM reviews WHERE id = $1', [id])
}

export async function countReviews() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM reviews')
  return parseInt(rows[0].count)
}
