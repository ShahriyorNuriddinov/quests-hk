import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const { rows } = await pool.query("SELECT title, steps FROM quests")
for (const row of rows) {
  console.log('\n' + row.title)
  const qs = row.steps.filter(s => s.type === 'question')
  qs.forEach(s => {
    const hasAnswer = !!s.answer
    // If correctAnswer index exists, verify answer matches it
    const indexMatch = s.correctAnswer !== undefined
      ? s.answer === s.options?.[s.correctAnswer]
      : true
    const ok = hasAnswer && indexMatch
    console.log(ok ? '  ✅' : '  ❌', s.title?.slice(0,40), '| answer:', s.answer)
  })
}
await pool.end()
