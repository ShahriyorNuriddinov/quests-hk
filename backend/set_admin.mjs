import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const r = await pool.query("UPDATE users SET role = 'admin' WHERE email = 'russianhongkonger@gmail.com' RETURNING email, role")
console.log(r.rows.length ? '✅ Admin: ' + r.rows[0].email : '❌ User topilmadi')
await pool.end()
