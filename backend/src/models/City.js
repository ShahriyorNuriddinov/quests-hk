import { pool } from '../db.js'

function toCity(row) {
  if (!row) return null
  return {
    id: row.id,
    _id: row.id,
    code: row.code,
    name: row.name,
    flag: row.flag,
    active: row.active,
    sortOrder: row.sort_order,
  }
}

export async function findAllCities() {
  const { rows } = await pool.query('SELECT * FROM cities ORDER BY sort_order ASC')
  return rows.map(toCity)
}

export async function findActiveCities() {
  const { rows } = await pool.query('SELECT * FROM cities WHERE active = true ORDER BY sort_order ASC')
  return rows.map(toCity)
}

export async function updateCity(id, data) {
  const sets = []
  const vals = []
  let i = 1
  if (data.name !== undefined) { sets.push(`name = $${i++}`); vals.push(data.name) }
  if (data.flag !== undefined) { sets.push(`flag = $${i++}`); vals.push(data.flag) }
  if (data.active !== undefined) { sets.push(`active = $${i++}`); vals.push(data.active) }
  if (data.sortOrder !== undefined) { sets.push(`sort_order = $${i++}`); vals.push(data.sortOrder) }
  if (!sets.length) return null
  sets.push(`updated_at = NOW()`)
  vals.push(id)
  const { rows } = await pool.query(
    `UPDATE cities SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals
  )
  return toCity(rows[0])
}

export async function createCity(data) {
  const { rows } = await pool.query(`
    INSERT INTO cities (code, name, flag, active, sort_order)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `, [data.code, data.name, data.flag || '', data.active || false, data.sortOrder || 0])
  return toCity(rows[0])
}

export async function deleteCity(id) {
  await pool.query('DELETE FROM cities WHERE id = $1', [id])
}
