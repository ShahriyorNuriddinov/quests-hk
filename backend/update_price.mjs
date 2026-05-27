import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const r = await pool.query("UPDATE quests SET price = 98 WHERE title = 'Монгкок: рынки, храмы и неон' RETURNING title, price")
console.log('✅', r.rows[0].title, '-', r.rows[0].price, 'HK$')
await pool.end()
