import { pool } from '../db.js'

function toQuest(row, withSteps = true) {
  if (!row) return null
  const q = {
    id: row.id,
    _id: row.id,
    title: row.title,
    description: row.description,
    duration: row.duration,
    distance: row.distance,
    difficulty: row.difficulty,
    price: parseFloat(row.price),
    currency: row.currency,
    locationsCount: row.locations_count,
    questionsCount: row.questions_count,
    transportCost: row.transport_cost,
    startPoint: row.start_point,
    endPoint: row.end_point,
    coverImage: row.cover_image,
    galleryImages: row.gallery_images || [],
    city: row.city || 'hk',
    partnerId: row.partner_id || null,
    status: row.status,
    rating: parseFloat(row.rating),
    completedCount: row.completed_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  if (withSteps) q.steps = row.steps || []
  return q
}

export async function findAllQuests({ status, city, withSteps = false } = {}) {
  const params = []
  const conditions = []
  if (status) { conditions.push(`q.status = $${params.length + 1}`); params.push(status) }
  if (city) { conditions.push(`q.city = $${params.length + 1}`); params.push(city) }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(`
    SELECT q.*,
      (SELECT COUNT(*)::int FROM user_quests WHERE quest_id = q.id) AS real_completed,
      COALESCE(
        (SELECT AVG(rating) FROM reviews WHERE quest_id = q.id AND approved = true),
        q.rating
      ) AS real_rating,
      u.email AS partner_email
    FROM quests q
    LEFT JOIN users u ON u.id = q.partner_id
    ${where}
    ORDER BY q.created_at DESC
  `, params)
  return rows.map(r => {
    const q = toQuest(r, withSteps)
    q.completedCount = r.real_completed
    q.rating = parseFloat(r.real_rating)
    if (q.partnerId) {
      q.freePromoLeft = Math.max(0, 25 - (r.real_completed || 0))
      q.partnerEmail = r.partner_email || null
    }
    return q
  })
}

export async function findQuestById(id, withSteps = true) {
  const { rows } = await pool.query(`
    SELECT q.*,
      (SELECT COUNT(*)::int FROM user_quests WHERE quest_id = q.id) AS real_completed,
      COALESCE(
        (SELECT AVG(rating) FROM reviews WHERE quest_id = q.id AND approved = true),
        q.rating
      ) AS real_rating,
      (SELECT COUNT(*)::int FROM reviews WHERE quest_id = q.id AND approved = true) AS review_count
    FROM quests q
    WHERE q.id = $1
  `, [id])
  if (!rows[0]) return null
  const quest = toQuest(rows[0], withSteps)
  quest.completedCount = rows[0].real_completed
  quest.rating = parseFloat(rows[0].real_rating)
  quest.reviewCount = rows[0].review_count
  if (quest.partnerId) quest.freePromoLeft = Math.max(0, 25 - (rows[0].real_completed || 0))
  return quest
}

export async function findQuestsByIds(ids, withSteps = false) {
  if (!ids.length) return []
  const { rows } = await pool.query('SELECT * FROM quests WHERE id = ANY($1::uuid[])', [ids])
  return rows.map(r => toQuest(r, withSteps))
}

export async function createQuest(data) {
  const { rows } = await pool.query(`
    INSERT INTO quests
      (title, description, duration, distance, difficulty, price, currency,
       locations_count, questions_count, transport_cost, start_point, end_point,
       cover_image, status, steps, gallery_images, city, partner_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    RETURNING *
  `, [
    data.title, data.description, data.duration, data.distance,
    data.difficulty || 'Легко', data.price || 0, data.currency || 'HK$',
    data.locationsCount || 0, data.questionsCount || 0, data.transportCost,
    data.startPoint, data.endPoint, data.coverImage,
    data.status || 'draft', JSON.stringify(data.steps || []),
    JSON.stringify(data.galleryImages || []), data.city || 'hk', data.partnerId || null,
  ])
  return toQuest(rows[0])
}

export async function updateQuest(id, data) {
  const colMap = {
    title: 'title', description: 'description', duration: 'duration',
    distance: 'distance', difficulty: 'difficulty', price: 'price',
    currency: 'currency', locationsCount: 'locations_count',
    questionsCount: 'questions_count', transportCost: 'transport_cost',
    startPoint: 'start_point', endPoint: 'end_point', coverImage: 'cover_image',
    status: 'status', rating: 'rating', completedCount: 'completed_count', steps: 'steps',
    galleryImages: 'gallery_images', city: 'city', partnerId: 'partner_id',
  }
  const jsonKeys = ['steps', 'galleryImages']
  const sets = []
  const vals = []
  let i = 1
  for (const [key, col] of Object.entries(colMap)) {
    if (data[key] !== undefined) {
      sets.push(`${col} = $${i++}`)
      vals.push(jsonKeys.includes(key) ? JSON.stringify(data[key]) : data[key])
    }
  }
  if (!sets.length) return findQuestById(id)
  sets.push(`updated_at = NOW()`)
  vals.push(id)
  const { rows } = await pool.query(
    `UPDATE quests SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals
  )
  return toQuest(rows[0])
}

export async function deleteQuest(id) {
  await pool.query('DELETE FROM quests WHERE id = $1', [id])
}

export async function countQuests(status) {
  const { rows } = await pool.query('SELECT COUNT(*) FROM quests WHERE status = $1', [status])
  return parseInt(rows[0].count)
}
