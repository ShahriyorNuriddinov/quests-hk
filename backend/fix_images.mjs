import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

await pool.query(`
  UPDATE quests SET cover_image = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Hong_Kong_at_night_from_Victoria_Peak.jpg/1280px-Hong_Kong_at_night_from_Victoria_Peak.jpg'
  WHERE title = 'Пик Виктория: над облаками Гонконга'
`)

await pool.query(`
  UPDATE quests SET cover_image = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/HK_Mong_Kok_night.jpg/1280px-HK_Mong_Kok_night.jpg'
  WHERE title = 'Монгкок: рынки, храмы и неон'
`)

console.log('✅ Rasmlar yangilandi')
await pool.end()
