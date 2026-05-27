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
    country: row.country || null,
    countryCode: row.country_code || null,
    coverImage: row.cover_image || null,
    questCount: row.quest_count ? parseInt(row.quest_count) : 0,
  }
}

export async function findAllCities() {
  const { rows } = await pool.query(`
    SELECT c.*,
      (SELECT COUNT(*) FROM quests q WHERE q.city = c.code AND q.status = 'published') AS quest_count
    FROM cities c ORDER BY c.sort_order ASC
  `)
  return rows.map(toCity)
}

export async function findActiveCities() {
  const { rows } = await pool.query(`
    SELECT c.*,
      (SELECT COUNT(*) FROM quests q WHERE q.city = c.code AND q.status = 'published') AS quest_count
    FROM cities c WHERE c.active = true ORDER BY c.sort_order ASC
  `)
  return rows.map(toCity)
}

export async function updateCity(id, data) {
  const sets = []
  const vals = []
  let i = 1
  if (data.name !== undefined)        { sets.push(`name = $${i++}`);         vals.push(data.name) }
  if (data.flag !== undefined)        { sets.push(`flag = $${i++}`);         vals.push(data.flag) }
  if (data.active !== undefined)      { sets.push(`active = $${i++}`);       vals.push(data.active) }
  if (data.sortOrder !== undefined)   { sets.push(`sort_order = $${i++}`);   vals.push(data.sortOrder) }
  if (data.country !== undefined)     { sets.push(`country = $${i++}`);      vals.push(data.country) }
  if (data.countryCode !== undefined) { sets.push(`country_code = $${i++}`); vals.push(data.countryCode) }
  if (data.coverImage !== undefined)  { sets.push(`cover_image = $${i++}`);  vals.push(data.coverImage) }
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
    INSERT INTO cities (code, name, flag, active, sort_order, country, country_code, cover_image)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
  `, [
    data.code, data.name, data.flag || '', data.active || false,
    data.sortOrder || 0, data.country || 'Азия', data.countryCode || 'asia',
    data.coverImage || null,
  ])
  return toCity(rows[0])
}

export async function deleteCity(id) {
  await pool.query('DELETE FROM cities WHERE id = $1', [id])
}
