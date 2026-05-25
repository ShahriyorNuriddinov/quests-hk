import { pool } from '../db.js'

function toPromo(row) {
  if (!row) return null
  return {
    id: row.id,
    _id: row.id,
    code: row.code,
    discount: parseFloat(row.discount),
    type: row.type,
    usedCount: row.used_count,
    maxUses: row.max_uses,
    active: row.active,
    partnerName: row.partner_name || '',
    partnerDescription: row.partner_description || '',
    earningsAccumulated: parseFloat(row.earnings_accumulated || 0),
    earningsTotal: parseFloat(row.earnings_total || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function findAllPromoCodes() {
  const { rows } = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC')
  return rows.map(toPromo)
}

export async function findPromoByCode(code, active) {
  let query = 'SELECT * FROM promo_codes WHERE code = $1'
  const params = [code.toUpperCase()]
  if (active !== undefined) { query += ' AND active = $2'; params.push(active) }
  const { rows } = await pool.query(query, params)
  return toPromo(rows[0])
}

export async function createPromoCode(data) {
  try {
    const { rows } = await pool.query(`
      INSERT INTO promo_codes (code, discount, type, max_uses, active, partner_name, partner_description)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [
      data.code?.toUpperCase(),
      data.discount,
      data.type || 'percent',
      data.maxUses ?? 100,
      data.active !== false,
      data.partnerName || '',
      data.partnerDescription || '',
    ])
    return toPromo(rows[0])
  } catch {
    const { rows } = await pool.query(`
      INSERT INTO promo_codes (code, discount, type, max_uses, active)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [
      data.code?.toUpperCase(),
      data.discount,
      data.type || 'percent',
      data.maxUses ?? 100,
      data.active !== false,
    ])
    return toPromo(rows[0])
  }
}

export async function updatePromoCode(id, data) {
  const sets = []
  const vals = []
  let i = 1
  if (data.active !== undefined) { sets.push(`active = $${i++}`); vals.push(data.active) }
  if (data.discount !== undefined) { sets.push(`discount = $${i++}`); vals.push(data.discount) }
  if (data.maxUses !== undefined) { sets.push(`max_uses = $${i++}`); vals.push(data.maxUses) }
  if (data.partnerName !== undefined) { sets.push(`partner_name = $${i++}`); vals.push(data.partnerName) }
  if (data.partnerDescription !== undefined) { sets.push(`partner_description = $${i++}`); vals.push(data.partnerDescription) }
  if (data.earningsAccumulated !== undefined) { sets.push(`earnings_accumulated = $${i++}`); vals.push(data.earningsAccumulated) }
  if (!sets.length) return null
  sets.push(`updated_at = NOW()`)
  vals.push(id)
  const { rows } = await pool.query(
    `UPDATE promo_codes SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals
  )
  return toPromo(rows[0])
}

export async function addPromoEarnings(code, amount) {
  await pool.query(
    `UPDATE promo_codes SET earnings_accumulated = earnings_accumulated + $2, earnings_total = earnings_total + $2, updated_at = NOW() WHERE code = $1`,
    [code, amount]
  )
}

export async function payoutPromo(id) {
  const { rows } = await pool.query(
    `UPDATE promo_codes SET earnings_accumulated = 0, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  )
  return toPromo(rows[0])
}

export async function incrementPromoUsed(id) {
  await pool.query(
    'UPDATE promo_codes SET used_count = used_count + 1, updated_at = NOW() WHERE id = $1',
    [id]
  )
}

export async function incrementPromoUsedByCode(code) {
  await pool.query(
    'UPDATE promo_codes SET used_count = used_count + 1, updated_at = NOW() WHERE code = $1',
    [code]
  )
}

export async function countActivePromoCodes() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM promo_codes WHERE active = true')
  return parseInt(rows[0].count)
}
