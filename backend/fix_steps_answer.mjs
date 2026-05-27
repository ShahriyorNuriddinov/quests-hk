import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

const { rows } = await pool.query('SELECT id, title, steps FROM quests')

for (const row of rows) {
  const steps = row.steps || []
  let changed = false

  const fixed = steps.map(step => {
    if (step.type === 'question' && step.correctAnswer !== undefined) {
      const correctAnswer = step.options?.[step.correctAnswer] ?? ''
      if (step.answer !== correctAnswer) {
        changed = true
        console.log(`  Fixing answer: "${step.answer}" → "${correctAnswer}" (index ${step.correctAnswer})`)
      }
      return { ...step, answer: correctAnswer }
    }
    return step
  })

  if (changed) {
    await pool.query('UPDATE quests SET steps = $1 WHERE id = $2', [JSON.stringify(fixed), row.id])
    console.log(`✅ Fixed: ${row.title}`)
  } else {
    console.log(`— OK (no change): ${row.title}`)
  }
}

await pool.end()
console.log('Done')
