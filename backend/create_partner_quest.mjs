import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

// Find partner users
const { rows: partners } = await pool.query(
  "SELECT id, email, role FROM users WHERE role = 'partner' ORDER BY created_at LIMIT 5"
)
console.log('Partner users:', partners)

if (partners.length === 0) {
  console.log('No partner users found. Creating a test partner user...')
  // Promote admin user to test as partner temporarily — actually let's just use admin as it has requirePartner access
  const { rows: admins } = await pool.query(
    "SELECT id, email FROM users WHERE role = 'admin' LIMIT 1"
  )
  if (!admins.length) { console.log('No admin either'); await pool.end(); process.exit(1) }
  console.log('Using admin as partner:', admins[0])
  var partnerId = admins[0].id
  var partnerEmail = admins[0].email
} else {
  var partnerId = partners[0].id
  var partnerEmail = partners[0].email
}

// Create a partner quest
const quest = {
  title: 'Прогулка по Sheung Wan',
  description: 'Откройте для себя скрытые сокровища старейшего района Гонконга — Sheung Wan. Уличные рынки, храмы, антикварные лавки и граффити на каждом шагу.',
  duration: '2–3 часа',
  distance: '2.5 км',
  difficulty: 'easy',
  price: 98,
  currency: 'HK$',
  city: 'hong-kong',
  status: 'pending',
  locationsCount: 5,
  questionsCount: 4,
  startPoint: 'MTR Sheung Wan, Exit B',
  endPoint: 'Hollywood Road Cat Street',
}

const { rows } = await pool.query(`
  INSERT INTO quests (
    title, description, duration, distance, difficulty,
    price, currency, city, status,
    locations_count, questions_count,
    start_point, end_point, partner_id,
    created_at, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW()
  ) RETURNING id, title, status, partner_id
`, [
  quest.title, quest.description, quest.duration, quest.distance, quest.difficulty,
  quest.price, quest.currency, quest.city, quest.status,
  quest.locationsCount, quest.questionsCount,
  quest.startPoint, quest.endPoint, partnerId
])

const created = rows[0]
console.log('\n✅ Partner quest created:')
console.log(`  ID: ${created.id}`)
console.log(`  Title: ${created.title}`)
console.log(`  Status: ${created.status}`)
console.log(`  Partner: ${partnerEmail} (${created.partner_id})`)

// Add steps
const steps = [
  {
    id: 1, type: 'navigation', order: 1,
    title: 'Старт: MTR Sheung Wan, выход B',
    content: 'Выйдите через выход B на Des Voeux Road West. Вы сразу окажетесь в сердце знаменитого района сушёных морепродуктов. Идите на север по Morrison Street, вдыхая запахи солёной рыбы и морских деликатесов.',
    location: { lat: 22.2866, lng: 114.1503, address: 'Sheung Wan MTR Station, Exit B' }
  },
  {
    id: 2, type: 'question', order: 2,
    title: 'Загадка рынка морепродуктов',
    content: 'Des Voeux Road West называют «улицей сушёных морепродуктов». Какой деликатес занимает здесь целые витрины — от 500 до 5000 гонконгских долларов за штуку?',
    options: ['Сушёные осьминоги', 'Плавники акулы', 'Морские огурцы', 'Сушёные морские ушки (абалон)'],
    answer: 'Сушёные морские ушки (абалон)'
  },
  {
    id: 3, type: 'navigation', order: 3,
    title: 'Голливудская дорога — улица антиквариата',
    content: 'Подъёмитесь по лестнице Ladder Street к Hollywood Road — самой старой улице Гонконга (1844 год). Здесь сотни магазинов торгуют фарфором эпохи Мин, нефритовыми украшениями и старыми картами Китая. Прогуляйтесь на запад до Man Mo Temple.',
    location: { lat: 22.2841, lng: 114.1515, address: 'Hollywood Road, Sheung Wan' }
  },
  {
    id: 4, type: 'location_info', order: 4,
    title: 'Храм Ман Мо — 180 лет истории',
    content: 'Перед вами один из старейших даосских храмов Гонконга, построенный в 1847 году. Храм посвящён двум божествам: Ман — богу литературы (чиновники молились ему перед экзаменами) и Мо — богу войны.\n\nТолстые спирали ладана свисают с потолка — каждая горит несколько недель. Прихожане оставляют молитвы, завязывая их в красные ленты.',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    facts: '• Построен в 1847 году — один из старейших в Гонконге\n• Два божества: Ман (литература) и Мо (война)\n• Вписан в список охраняемых памятников с 2010 года\n• Ежедневно сотни верующих приходят с подношениями'
  },
  {
    id: 5, type: 'photo', order: 5,
    title: 'Финишное фото на Cat Street!',
    content: 'Дойдите до Upper Lascar Row (Cat Street) — блошиного рынка под открытым небом. Сфотографируйтесь среди рядов с монетами, значками и антикварными игрушками. Ваш трофей из старого Гонконга! 📸'
  }
]

await pool.query(
  'UPDATE quests SET steps = $1 WHERE id = $2',
  [JSON.stringify(steps), created.id]
)
console.log(`  Steps: ${steps.length} added`)
console.log('\n🔗 Admin review link: /admin/quests')
console.log(`🔗 Partner quest edit: /partner/quests/${created.id}`)

// Check partner_profiles
const { rows: profile } = await pool.query(
  'SELECT * FROM partner_profiles WHERE user_id = $1', [partnerId]
)
if (!profile.length) {
  await pool.query(
    'INSERT INTO partner_profiles (user_id, payout_percent, business_name) VALUES ($1, 70, $2)',
    [partnerId, 'Demo Partner']
  )
  console.log('  partner_profiles: created with 70% payout')
} else {
  console.log('  partner_profiles:', profile[0])
}

await pool.end()
