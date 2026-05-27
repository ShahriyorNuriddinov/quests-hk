import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

await pool.query(`
  UPDATE quests
  SET cover_image = 'https://picsum.photos/seed/victoriapeak/800/500'
  WHERE title = 'Пик Виктория: над облаками Гонконга'
`)

await pool.query(`
  UPDATE quests
  SET cover_image = 'https://picsum.photos/seed/mongkok/800/500'
  WHERE title = 'Монгкок: рынки, храмы и неон'
`)

console.log('✅ Rasmlar yangilandi')
await pool.end()
