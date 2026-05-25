import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/questshk',
  ssl: process.env.DATABASE_URL?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
})

const quest = {
  title: 'Тайны старого Гонконга',
  description: 'Пешеходный квест по историческому центру Гонконга. Вы пройдёте по самым атмосферным улочкам, узнаете истории старых храмов и рынков, ответите на вопросы и сделаете потрясающие фотографии. Маршрут подходит для всех возрастов и не требует физической подготовки.',
  duration: '2-3 часа',
  distance: '3.5 км',
  difficulty: 'Легко',
  price: 149,
  currency: 'HK$',
  locations_count: 6,
  questions_count: 3,
  transport_cost: 'Бесплатно (пешком)',
  start_point: 'MTR Sheung Wan, Exit A2',
  end_point: 'MTR Central, Exit D2',
  cover_image: 'https://images.unsplash.com/photo-1536599018102-9f803c979b13?w=800&q=80',
  status: 'published',
  city: 'hk',
  gallery_images: JSON.stringify([
    'https://images.unsplash.com/photo-1536599018102-9f803c979b13?w=400&q=80',
    'https://images.unsplash.com/photo-1506970845246-18f21d533b20?w=400&q=80',
    'https://images.unsplash.com/photo-1517144447511-aebb25bbc5fa?w=400&q=80',
    'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=400&q=80',
    'https://images.unsplash.com/photo-1494587416117-f102a2ac0a8d?w=400&q=80',
    'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&q=80',
  ]),
  steps: JSON.stringify([
    {
      _id: 'step-001',
      type: 'info',
      title: 'Добро пожаловать!',
      content: 'Сегодня вы отправитесь в путешествие по историческому Гонконгу. Мы пройдём от станции Sheung Wan до Central через старинные храмы, рынки антиквариата и уютные переулки. Не спешите — наслаждайтесь каждым шагом! На маршруте вас ждут 6 локаций, 3 вопроса и много интересных фактов.',
      image: 'https://images.unsplash.com/photo-1536599018102-9f803c979b13?w=800&q=80',
      order: 0,
    },
    {
      _id: 'step-002',
      type: 'navigation',
      title: 'Храм Ман Мо',
      content: 'Направляйтесь к храму Ман Мо на Hollywood Road. Это один из старейших храмов Гонконга, построенный в 1847 году. Вы узнаете его по огромным спиральным благовониям, свисающим с потолка.',
      image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1558431382-27e303142255?w=400&q=80',
        'https://images.unsplash.com/photo-1583789793320-28cd18669199?w=400&q=80',
      ],
      location: { lat: 22.2839, lng: 114.1501, address: '124-126 Hollywood Rd, Sheung Wan' },
      order: 1,
    },
    {
      _id: 'step-003',
      type: 'location_info',
      title: 'Храм Ман Мо — история и факты',
      content: 'Храм Ман Мо (Man Mo Temple) посвящён двум божествам: Ман (бог литературы) и Мо (бог войны). Это место, где учёные и воины приходили просить благословения перед экзаменами и сражениями.',
      image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800&q=80',
      history: 'Храм был построен в 1847 году, вскоре после того как Гонконг стал британской колонией. Он служил не только религиозным целям, но и местом разрешения споров между китайскими жителями, которые предпочитали клятву перед богами британскому суду.',
      facts: '• Спиральные благовония горят до 2 недель непрерывно\n• Храм внесён в список памятников Гонконга Grade I\n• Здесь снимали сцены для фильма "Лара Крофт: Расхитительница гробниц 2"\n• Ежедневно храм посещают более 10,000 человек',
      order: 2,
    },
    {
      _id: 'step-004',
      type: 'question',
      title: 'Вопрос о храме',
      content: 'Каким двум божествам посвящён храм Ман Мо?',
      options: [
        'Бог огня и бог воды',
        'Бог литературы и бог войны',
        'Бог удачи и бог богатства',
        'Бог неба и бог земли',
      ],
      answer: 'Бог литературы и бог войны',
      hint: 'Подсказка: "Ман" означает литературу, "Мо" — что-то воинственное',
      order: 3,
    },
    {
      _id: 'step-005',
      type: 'answer',
      title: 'Правильный ответ',
      content: 'Бог литературы и бог войны',
      explanation: 'Верно! Храм Ман Мо посвящён богу литературы (文 Ман Чёнг) и богу войны (武 Мо Тай). Ман изображается с кистью для каллиграфии, а Мо — с мечом. Учёные приходили сюда перед имперскими экзаменами, а воины — перед битвами.',
      image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800&q=80',
      order: 4,
    },
    {
      _id: 'step-006',
      type: 'photo',
      title: 'Сделайте фото',
      content: 'Сфотографируйте спиральные благовония, свисающие с потолка храма. Это один из самых узнаваемых символов Гонконга!',
      image: 'https://images.unsplash.com/photo-1583789793320-28cd18669199?w=400&q=80',
      order: 5,
    },
    {
      _id: 'step-007',
      type: 'navigation',
      title: 'Лестница к Середине уровней',
      content: 'Выйдите из храма и поверните направо. Пройдите до Central-Mid-Levels Escalator — самого длинного уличного эскалатора в мире (800 метров). Поднимитесь на один уровень вверх.',
      image: 'https://images.unsplash.com/photo-1506970845246-18f21d533b20?w=800&q=80',
      location: { lat: 22.2835, lng: 114.1535, address: 'Central-Mid-Levels Escalator' },
      order: 6,
    },
    {
      _id: 'step-008',
      type: 'location_info',
      title: 'Эскалатор Mid-Levels',
      content: 'Central-Mid-Levels Escalator — это система из 20 эскалаторов и 3 движущихся тротуаров, протянувшаяся на 800 метров от Des Voeux Road до Conduit Road.',
      history: 'Эскалатор был открыт в 1993 году и обошёлся в 245 миллионов гонконгских долларов. Изначально его построили, чтобы облегчить путь пешеходам между жилыми районами на склонах и деловым центром внизу.',
      facts: '• Длина: 800 метров — самый длинный открытый эскалатор в мире\n• Перепад высот: 135 метров\n• Ежедневно перевозит 85,000 пассажиров\n• Утром (6:00-10:00) едет вниз, после 10:00 — вверх\n• Появляется в фильме Вонга Кар-Вая "Чунгкингский экспресс"',
      order: 7,
    },
    {
      _id: 'step-009',
      type: 'question',
      title: 'Вопрос об эскалаторе',
      content: 'Какова длина Central-Mid-Levels Escalator?',
      options: ['400 метров', '600 метров', '800 метров', '1200 метров'],
      answer: '800 метров',
      hint: 'Вы только что прочитали об этом на предыдущем шаге!',
      order: 8,
    },
    {
      _id: 'step-010',
      type: 'answer',
      title: 'Правильный ответ',
      content: '800 метров',
      explanation: '800 метров — это делает его самым длинным открытым эскалатором в мире. Подъём от начала до конца занимает около 20 минут, но вам не нужно проходить весь путь — выходите на любом уровне!',
      order: 9,
    },
    {
      _id: 'step-011',
      type: 'navigation',
      title: 'Улица Кэт Стрит (антикварный рынок)',
      content: 'Спуститесь обратно и пройдите к Cat Street (Upper Lascar Row). Здесь расположен знаменитый рынок антиквариата, где можно найти всё от старинных монет до Мао-сувениров.',
      image: 'https://images.unsplash.com/photo-1517144447511-aebb25bbc5fa?w=800&q=80',
      location: { lat: 22.2845, lng: 114.1490, address: 'Upper Lascar Row (Cat Street), Sheung Wan' },
      order: 10,
    },
    {
      _id: 'step-012',
      type: 'location_info',
      title: 'Кэт Стрит — рынок антиквариата',
      content: 'Upper Lascar Row, известная как Cat Street, — это пешеходная улица, заставленная лотками с антиквариатом, винтажными вещами и сувенирами. Название "Cat Street" происходит не от кошек, а от воров-карманников.',
      history: 'В XIX веке улица была известна как место, куда воры сбывали краденое. "Cats" — это сленговое слово для воров, а покупатели краденого назывались "rats" (крысы). Со временем улица трансформировалась в легальный антикварный рынок.',
      facts: '• Здесь можно найти артефакты времён династий Мин и Цин\n• Многие "антикварные" вещи на самом деле умело сделанные копии\n• Лучшее время для посещения — утро будних дней\n• Каждую субботу проходит блошиный рынок с особыми лотами',
      order: 11,
    },
    {
      _id: 'step-013',
      type: 'question',
      title: 'Вопрос о Cat Street',
      content: 'Почему улицу называют "Cat Street"?',
      options: [
        'Здесь живёт много бездомных кошек',
        'Улица напоминает форму кошки',
        '"Cats" — сленг для воров, которые здесь сбывали краденое',
        'Здесь был кошачий приют в XIX веке',
      ],
      answer: '"Cats" — сленг для воров, которые здесь сбывали краденое',
      hint: 'Подсказка: вспомните историю улицы...',
      order: 12,
    },
    {
      _id: 'step-014',
      type: 'answer',
      title: 'Правильный ответ',
      content: '"Cats" — сленг для воров, которые здесь сбывали краденое',
      explanation: 'В Гонконге XIX века "cats" (кошки) были жаргонным названием для воров-карманников, а "rats" (крысы) — для покупателей краденого. Улица была известна как место скупки краденого, и название прижилось, хотя сейчас здесь абсолютно легальный антикварный рынок.',
      order: 13,
    },
    {
      _id: 'step-015',
      type: 'photo',
      title: 'Фото на память',
      content: 'Сфотографируйте самый интересный лоток на Cat Street или необычный антикварный предмет, который вам приглянулся!',
      image: 'https://images.unsplash.com/photo-1517144447511-aebb25bbc5fa?w=400&q=80',
      order: 14,
    },
    {
      _id: 'step-016',
      type: 'info',
      title: 'Квест завершён!',
      content: 'Поздравляем! Вы прошли квест "Тайны старого Гонконга"! Вы посетили древний храм, прокатились на самом длинном эскалаторе мира и побродили по антикварному рынку. Надеемся, вам понравилось!\n\nОставьте отзыв — это поможет другим путешественникам!',
      image: 'https://images.unsplash.com/photo-1536599018102-9f803c979b13?w=800&q=80',
      order: 15,
    },
  ]),
}

async function seed() {
  try {
    const { rows } = await pool.query(`
      INSERT INTO quests
        (title, description, duration, distance, difficulty, price, currency,
         locations_count, questions_count, transport_cost, start_point, end_point,
         cover_image, status, steps, gallery_images, city)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING id, title
    `, [
      quest.title, quest.description, quest.duration, quest.distance,
      quest.difficulty, quest.price, quest.currency,
      quest.locations_count, quest.questions_count, quest.transport_cost,
      quest.start_point, quest.end_point, quest.cover_image,
      quest.status, quest.steps, quest.gallery_images, quest.city,
    ])
    console.log(`Quest created: "${rows[0].title}" (id: ${rows[0].id})`)
  } catch (err) {
    console.error('Error seeding quest:', err.message)
  } finally {
    await pool.end()
  }
}

seed()
