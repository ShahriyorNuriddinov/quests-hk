import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const { rows } = await pool.query('SELECT code, name, flag, country, active FROM cities ORDER BY sort_order')
rows.forEach(r => console.log(`[${r.active?'✅':'❌'}] ${r.flag} ${r.name} | country="${r.country}"`))
await pool.end()
