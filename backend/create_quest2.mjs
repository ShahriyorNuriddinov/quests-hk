import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

const steps = [
  {
    id: 1, type: 'info', title: 'Добро пожаловать на Пик Виктория! 🏔️',
    content: 'Пик Виктория — самая высокая точка острова Гонконг (552 м). Отсюда открывается один из красивейших видов в мире: небоскрёбы Центрального района, бухта Виктория и горы на горизонте. Сегодня вы пройдёте по историческому Пиковому Трамваю и откроете секреты этого легендарного места!',
    image: 'https://images.unsplash.com/photo-1605139032894-e5a53e5e2e7e?w=800'
  },
  {
    id: 2, type: 'navigation', title: '🚋 Нижняя станция Пикового Трамвая',
    content: 'Найдите нижнюю станцию Peak Tram на Garden Road. Этот фуникулёр работает с 1888 года и является старейшим в Азии! Угол наклона достигает 27 градусов — держитесь крепче!',
    location: { lat: 22.2796, lng: 114.1580, address: 'Peak Tram Lower Terminus, Garden Road, Central' }
  },
  {
    id: 3, type: 'question', title: '🎯 Вопрос о трамвае',
    content: 'В каком году был открыт Пиковый Трамвай — старейший фуникулёр Азии?',
    options: ['1865', '1888', '1901', '1923'],
    correctAnswer: 1
  },
  {
    id: 4, type: 'navigation', title: '🌆 Смотровая площадка Sky Terrace 428',
    content: 'Поднимитесь на смотровую площадку Sky Terrace 428 на высоте 428 метров. Здесь вы увидите панораму Гонконга во всей красе. Лучшее время — после заката, когда весь город светится огнями!',
    location: { lat: 22.2716, lng: 114.1453, address: 'Sky Terrace 428, Victoria Peak' }
  },
  {
    id: 5, type: 'question', title: '🎯 Вопрос о высоте',
    content: 'На какой высоте над уровнем моря находится смотровая площадка Sky Terrace 428?',
    options: ['328 метров', '552 метра', '428 метров', '280 метров'],
    correctAnswer: 2
  },
  {
    id: 6, type: 'navigation', title: '🌿 Прогулка по Peak Circle Walk',
    content: 'Пройдите по знаменитой тропе Peak Circle Walk — 3,5 км вокруг вершины. Вы увидите роскошные особняки, густые джунгли и потрясающие виды на все стороны острова. Здесь живут самые богатые жители Гонконга!',
    location: { lat: 22.2688, lng: 114.1422, address: 'Lugard Road, Victoria Peak' }
  },
  {
    id: 7, type: 'question', title: '🎯 Вопрос о рекордах',
    content: 'Гонконг занимает первое место в мире по количеству небоскрёбов. Сколько зданий выше 150 метров находится в городе?',
    options: ['Около 100', 'Около 550', 'Около 350', 'Около 1500'],
    correctAnswer: 2
  },
  {
    id: 8, type: 'navigation', title: '🍵 Чайный домик на вершине',
    content: 'Найдите кафе или ресторан на вершине Пика и насладитесь чашкой гонконгского молочного чая — "чай пополам" (鴛鴦, yuenyeung) с видом на город. Это смесь кофе и чая с молоком — настоящий гонконгский вкус!',
    location: { lat: 22.2716, lng: 114.1453, address: 'The Peak Galleria, Victoria Peak' }
  },
  {
    id: 9, type: 'question', title: '🎯 Финальный вопрос',
    content: 'Как называется традиционный гонконгский напиток — смесь чая и кофе с молоком?',
    options: ['Тэ Тарик', 'Юэньянь (鴛鴦)', 'Bubble Tea', 'Гонконгский лимонад'],
    correctAnswer: 1
  },
  {
    id: 10, type: 'info', title: '🏆 Вы покорили Пик Виктория!',
    content: 'Поздравляем! Вы познакомились с одним из самых знаковых мест Гонконга. Вы узнали историю старейшего фуникулёра Азии, полюбовались панорамой небоскрёбов и попробовали настоящий гонконгский вкус. Гонконг навсегда останется в вашем сердце! 🇭🇰',
    image: 'https://images.unsplash.com/photo-1576769562804-455efb3e4ce3?w=800'
  }
]

const r = await pool.query(`
  INSERT INTO quests (title, description, duration, distance, difficulty, price, currency,
    locations_count, questions_count, transport_cost, start_point, end_point, cover_image, status, rating, steps)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
  RETURNING id, title
`, [
  'Пик Виктория: над облаками Гонконга',
  'Поднимитесь на самую знаменитую вершину Гонконга! Старейший фуникулёр Азии, потрясающая панорама небоскрёбов, тропические джунгли и настоящий гонконгский чай — всё это ждёт вас на Пике Виктория.',
  '3-4 часа', '5 км', 'Средне', 128, 'HK$', 4, 4,
  'MTR: Central Station → Автобус 15C',
  'Peak Tram Lower Terminus, Garden Road',
  'The Peak Galleria',
  'https://images.unsplash.com/photo-1576769562804-455efb3e4ce3?w=800',
  'published', 5.0,
  JSON.stringify(steps)
])

console.log('✅ Quest yaratildi:', r.rows[0].title, '| ID:', r.rows[0].id)
await pool.end()
