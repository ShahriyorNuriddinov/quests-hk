import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

const r = await pool.query("UPDATE quests SET city = 'hk' WHERE city = 'hong-kong' RETURNING title, city")
console.log('Fixed quests:', r.rows)
await pool.end()
