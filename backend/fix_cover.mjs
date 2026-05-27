import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

const r = await pool.query(
  "UPDATE quests SET cover_image = 'https://picsum.photos/seed/centralhk/800/500' WHERE id = 'f7b6a585-d81d-4ed5-808d-71b1cd9c73ad' RETURNING title, cover_image"
)
console.log('✅', r.rows[0])
await pool.end()
