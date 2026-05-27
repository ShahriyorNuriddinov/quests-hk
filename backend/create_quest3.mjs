import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

const steps = [
  {
    id: 1, type: 'info', order: 1,
    title: 'Добро пожаловать на Temple Street! 🌙',
    content: 'Temple Street — легендарный ночной рынок Гонконга в районе Джордан. Каждый вечер сотни торговцев раскладывают свои товары: уличная еда, гадалки, опера под открытым небом и огни неоновых вывесок. Местные называют его «мужским рынком» — здесь продают часы, инструменты и всякую всячину. Сегодня вы пройдёте по этому живому музею под звёздами!',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
  },
  {
    id: 2, type: 'navigation', order: 2,
    title: '🚇 Станция MTR Jordan',
    content: 'Начните путь на станции Jordan (линия Tsuen Wan). Выйдите через выход A и идите прямо по Nathan Road на север. Через 5 минут слева увидите ворота Temple Street. Рынок начинает работать около 18:00 и живёт до полуночи.',
    location: { lat: 22.3050, lng: 114.1718, address: 'Jordan MTR Station, Exit A, Nathan Road' }
  },
  {
    id: 3, type: 'question', order: 3,
    title: '🎯 Вопрос о рынке',
    content: 'Temple Street называют «мужским рынком». Но какой храм дал название этой улице?',
    options: ['Храм Тигра', 'Храм Тьен Хау (богини моря)', 'Храм нефритового Будды', 'Конфуцианский храм'],
    answer: 'Храм Тьен Хау (богини моря)'
  },
  {
    id: 4, type: 'navigation', order: 4,
    title: '🔮 Аллея гадалок',
    content: 'В центре рынка найдите «Аллею гадалок» — ряд столиков под зонтиками, где предсказатели читают судьбу по лицу, руке и птицам. Некоторые гадалки работают здесь уже 40 лет! Обратите внимание на клетки с птицами — они выбирают карточки с предсказаниями.',
    location: { lat: 22.3075, lng: 114.1700, address: 'Temple Street Fortune Tellers Alley, Jordan' }
  },
  {
    id: 5, type: 'question', order: 5,
    title: '🎯 Вопрос о традициях',
    content: 'Гонконгские гадалки используют особых птиц, которые выбирают карточки с предсказаниями. Что это за птицы?',
    options: ['Попугаи', 'Вороны', 'Зяблики и канарейки', 'Голуби'],
    answer: 'Зяблики и канарейки'
  },
  {
    id: 6, type: 'navigation', order: 6,
    title: '🎭 Уличная опера',
    content: 'Пройдите к северной части Temple Street — здесь вы услышите кантонскую оперу прямо на улице! Пожилые мужчины собираются вокруг столиков с чаем и поют традиционные арии. Это бесплатный живой концерт, которому сотни лет. Остановитесь, закройте глаза и послушайте.',
    location: { lat: 22.3095, lng: 114.1695, address: 'Temple Street, near Kansu Street intersection' }
  },
  {
    id: 7, type: 'question', order: 7,
    title: '🎯 Вопрос об опере',
    content: 'Кантонская опера включена в список нематериального наследия ЮНЕСКО. В каком году это произошло?',
    options: ['2003', '2009', '2015', '2019'],
    answer: '2009'
  },
  {
    id: 8, type: 'navigation', order: 8,
    title: '🦑 Уличная еда — обязательно попробуй!',
    content: 'Найдите палатку с жареными кальмарами или «рыбными шариками» (魚蛋, fishballs) — главный уличный снэк Гонконга. Они продаются на шпажках в остром или карри-соусе. Ещё попробуйте «вафли-яйца» (雞蛋仔, egg waffles) — хрустящие шарики на вафельнице, придуманные в 1950-х годах.',
    location: { lat: 22.3080, lng: 114.1698, address: 'Temple Street Night Market Food Stalls' }
  },
  {
    id: 9, type: 'question', order: 9,
    title: '🎯 Финальный вопрос',
    content: 'Вафли-яйца (egg waffles) — символ уличной еды Гонконга. В какое десятилетие они были впервые приготовлены?',
    options: ['1930-е', '1950-е', '1970-е', '1990-е'],
    answer: '1950-е'
  },
  {
    id: 10, type: 'info', order: 10,
    title: '🏆 Вы прошли Temple Street!',
    content: 'Поздравляем! Вы окунулись в настоящую ночную жизнь Гонконга. Гадалки, кантонская опера, уличная еда и море неона — всё это Temple Street, живое сердце старого Коулуна. Возвращайтесь сюда после заката — каждый вечер рынок немного другой! 🌙',
    image: 'https://images.unsplash.com/photo-1609780447631-05b93e5a88ea?w=800'
  }
]

const r = await pool.query(`
  INSERT INTO quests (title, description, duration, distance, difficulty, price, currency,
    locations_count, questions_count, transport_cost, start_point, end_point, cover_image, status, rating, steps)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
  RETURNING id, title
`, [
  'Temple Street: ночной рынок старого Коулуна',
  'Погрузитесь в магию ночного Гонконга! Гадалки с птицами, кантонская опера под открытым небом, рыбные шарики и неоновый лабиринт улиц — Temple Street ждёт вас после заката.',
  '2-3 часа', '3 км', 'Легко', 88, 'HK$', 3, 3,
  'MTR: Jordan Station, Выход A',
  'Jordan MTR Station',
  'Kansu Street, Temple Street',
  'https://picsum.photos/seed/templestreet/800/500',
  'published', 5.0,
  JSON.stringify(steps)
])

console.log('✅ Quest yaratildi:', r.rows[0].title, '| ID:', r.rows[0].id)
await pool.end()
