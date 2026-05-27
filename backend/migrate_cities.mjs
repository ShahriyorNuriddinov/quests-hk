import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

await pool.query(`
  ALTER TABLE cities ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Asia';
  ALTER TABLE cities ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'asia';
  ALTER TABLE cities ADD COLUMN IF NOT EXISTS cover_image TEXT;
`)

// Seed existing cities with proper data
await pool.query(`
  UPDATE cities SET country = 'Китай / Азия', country_code = 'asia', cover_image = 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800'
  WHERE code = 'hk';
  UPDATE cities SET country = 'Китай / Азия', country_code = 'asia', cover_image = 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=800'
  WHERE code = 'macau';
  UPDATE cities SET country = 'Китай / Азия', country_code = 'asia', cover_image = 'https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=800'
  WHERE code = 'guangzhou';
  UPDATE cities SET country = 'Китай / Азия', country_code = 'asia', cover_image = 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=800'
  WHERE code = 'sh';
`)

const { rows } = await pool.query('SELECT code, name, country, cover_image FROM cities ORDER BY sort_order')
console.log('Cities updated:')
rows.forEach(r => console.log(`  ${r.code}: ${r.country} | image: ${r.cover_image ? '✅' : '❌'}`))

await pool.end()
