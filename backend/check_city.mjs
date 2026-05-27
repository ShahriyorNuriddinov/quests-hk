import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

const quests = await pool.query("SELECT id, title, city, status FROM quests ORDER BY created_at DESC LIMIT 10")
console.log('Quests:')
quests.rows.forEach(q => console.log(`  [${q.status}] ${q.title.substring(0,40)} | city=${q.city}`))

const cities = await pool.query("SELECT code, name FROM cities ORDER BY sort_order")
console.log('\nCity codes:', cities.rows.map(c => c.code))

await pool.end()
