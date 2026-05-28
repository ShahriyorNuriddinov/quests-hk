import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

await pool.query(`
  UPDATE cities SET country = 'Азия', country_code = 'asia' WHERE code = 'hk';
  UPDATE cities SET country = 'Азия', country_code = 'asia' WHERE code = 'macau';
  UPDATE cities SET country = 'Азия', country_code = 'asia' WHERE code = 'guangzhou';
  UPDATE cities SET country = 'Азия', country_code = 'asia' WHERE code = 'sh';
`)

const { rows } = await pool.query('SELECT code, flag, name, country FROM cities ORDER BY sort_order')
rows.forEach(r => console.log(`${r.flag} ${r.name} → "${r.country}"`))
await pool.end()
