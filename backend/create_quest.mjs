import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

const steps = [
  {
    id: 1, type: 'info', title: 'Добро пожаловать в Монгкок!',
    content: 'Монгкок — самый оживлённый район Гонконга. Здесь на каждом квадратном метре кипит жизнь: рынки, храмы, неоновые вывески и уличная еда. Начнём наше путешествие!',
    image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800'
  },
  {
    id: 2, type: 'navigation', title: 'Рынок Женских Улиц',
    content: 'Идите на рынок Женских Улиц (Ladies Market) на улице Тун Чой. Здесь продают одежду, сувениры и украшения по очень низким ценам.',
    location: { lat: 22.3193, lng: 114.1694, address: 'Tung Choi Street, Mong Kok' }
  },
  {
    id: 3, type: 'question', title: 'Вопрос о рынке',
    content: 'Как называется улица, на которой расположен Ladies Market?',
    options: ['Tung Choi Street', 'Nathan Road', 'Dundas Street', 'Fa Yuen Street'],
    correctAnswer: 0
  },
  {
    id: 4, type: 'navigation', title: 'Храм Вонг Тай Син',
    content: 'Направляйтесь к храму Вонг Тай Син — одному из самых известных даосских храмов Гонконга. Здесь молятся о здоровье, удаче и любви.',
    location: { lat: 22.3425, lng: 114.1935, address: 'Wong Tai Sin Temple, Kowloon' }
  },
  {
    id: 5, type: 'question', title: 'Вопрос о храме',
    content: 'Какому богу посвящён храм Вонг Тай Син?',
    options: ['Богу богатства', 'Богу исцеления', 'Богу войны', 'Богу моря'],
    correctAnswer: 1
  },
  {
    id: 6, type: 'navigation', title: 'Улица Золотых Рыбок',
    content: 'Найдите знаменитую Tung Choi Street — северную часть, известную как "Улица золотых рыбок". Здесь сотни магазинов с экзотическими рыбами и питомцами.',
    location: { lat: 22.3228, lng: 114.1698, address: 'Goldfish Market, Tung Choi St North' }
  },
  {
    id: 7, type: 'navigation', title: 'Рынок Птиц',
    content: 'Посетите Yuen Po Street Bird Garden — рынок птиц под открытым небом. Здесь продают певчих птиц в красивых бамбуковых клетках.',
    location: { lat: 22.3272, lng: 114.1712, address: 'Yuen Po Street Bird Garden' }
  },
  {
    id: 8, type: 'question', title: 'Финальный вопрос',
    content: 'Сколько человек проживает в районе Монгкок на 1 км²? (Это один из самых плотных районов мира)',
    options: ['50,000', '130,000', '340,000', '500,000'],
    correctAnswer: 1
  },
  {
    id: 9, type: 'info', title: 'Поздравляем! 🎉',
    content: 'Вы завершили квест по Монгкоку! Вы побывали на знаменитых рынках, посетили храм и узнали много интересного об одном из самых живых районов Азии. Отличная работа!',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
  }
]

const r = await pool.query(`
  INSERT INTO quests (title, description, duration, distance, difficulty, price, currency,
    locations_count, questions_count, transport_cost, start_point, end_point, cover_image, status, rating, steps)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
  RETURNING id, title
`, [
  'Монгкок: рынки, храмы и неон',
  'Откройте для себя самый оживлённый район Гонконга — Монгкок. Рынки, даосские храмы, улица золотых рыбок и неоновые вывески ждут вас!',
  '2-3 часа', '4 км', 'Легко', 0, 'HK$', 5, 3,
  'MTR: Mong Kok Station', 'Tung Choi Street (Ladies Market)', 'Yuen Po Street Bird Garden',
  'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800',
  'published', 5.0,
  JSON.stringify(steps)
])

console.log('✅ Quest yaratildi:', r.rows[0].title, '| ID:', r.rows[0].id)
await pool.end()
