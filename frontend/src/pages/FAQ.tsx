import { useState } from 'react'
import { ChevronDown, MessageCircle, Shield, CreditCard, Cookie } from 'lucide-react'
import BottomNav from '../components/BottomNav'

const faqs = [
  { q: 'Как я получу доступ к квесту?', a: 'Сразу после оплаты квест будет доступен в личном кабинете — во вкладке «Мои квесты».' },
  { q: 'Сколько по времени длится?', a: 'Зависит от темпа и количества остановок. На странице каждого квеста указано среднее время прохождения.' },
  { q: 'Будет ли экскурсовод?', a: 'Нет, роль гида выполняет ваш телефон. Маршрут детально прописан — вы точно не потеряетесь. Плюс интересные факты и городские легенды по пути.' },
  { q: 'Как начать?', a: 'Купите квест, откройте вкладку «Мои квесты» и нажмите «Начать». Приходите на стартовую точку — и вперёд!' },
  { q: 'Сложные вопросы?', a: 'Вопросы комфортного уровня — чтобы чувствовать интерес и азарт. Найти ответ всегда можно, если внимательно смотреть вокруг.' },
  { q: 'Если я не смогу ответить?', a: 'Просто выберите другой вариант — так вы узнаете правильный ответ и сможете продолжить.' },
  { q: 'Сколько может быть человек?', a: 'Любое количество! Оптимально — от 2 до 6. Если больше, рекомендуем купить несколько квестов и разделиться на команды.' },
  { q: 'А можно устроить соревнование?', a: 'Конечно! Позитивные эмоции и яркие воспоминания гарантированы.' },
  { q: 'В течение какого времени можно пройти квест?', a: 'В течение года с момента покупки, в любой удобный день. Лучше выбирать светлое время суток.' },
  { q: 'Могу ли я повторно пройти квест?', a: 'Нет, квест проходится один раз — как билет в театр. Внимательно читайте задания.' },
  { q: 'Можно открыть квест на 2х телефонах?', a: 'Технически да, но удобнее на одном: один участник зачитывает вопросы, все ищут ответ вместе.' },
  { q: 'Что делать если телефон разрядился?', a: 'Не паникуйте! Войдите в личный кабинет с любого устройства — квест продолжится с того же места.' },
  { q: 'Что нужно для квеста?', a: 'Заряженный телефон с интернетом, хорошее настроение и немного азарта. Остальное приложится!' },
  { q: 'Интересно ли детям?', a: 'Да! Квесты отлично подходят для детей от 8 лет — познавательный формат, активное движение, живые эмоции.' },
]

const legal = [
  {
    Icon: Shield,
    title: 'Политика конфиденциальности',
    content: `Мы собираем минимально необходимые данные: адрес электронной почты и историю покупок.

Email используется исключительно для:
• авторизации в приложении;
• отправки подтверждений оплаты;
• уведомлений о запуске квестов в новых городах (только при согласии).

Ваши данные не передаются третьим лицам, не продаются и не используются в рекламных целях без вашего согласия. Мы не храним платёжные данные — все транзакции обрабатываются через защищённую платёжную систему Airwallex.

Вы вправе запросить удаление вашего аккаунта и всех связанных данных, написав нам на: support@quests-hk.com

Используя приложение, вы соглашаетесь с настоящей политикой конфиденциальности.`,
  },
  {
    Icon: CreditCard,
    title: 'Условия оплаты',
    content: `Оплата производится через платёжную систему Airwallex — международный провайдер, сертифицированный по стандарту PCI DSS.

Что важно знать:
• Платёж списывается единовременно в момент покупки.
• Квест предоставляется сразу после подтверждения оплаты.
• Все цены указаны в гонконгских долларах (HK$), если не указано иное.
• Возврат средств: квест является цифровым продуктом. Возврат возможен только если доступ к квесту не был предоставлен по технической причине — в течение 24 часов с момента покупки.
• По вопросам возврата пишите: support@quests-hk.com

Безопасность: данные карты не хранятся на наших серверах. Транзакции шифруются по стандарту TLS 1.2+. Airwallex имеет лицензию на оказание платёжных услуг в Гонконге (лицензия MSO).`,
  },
  {
    Icon: Cookie,
    title: 'Политика использования cookies',
    content: `Мы используем технические файлы cookie и localStorage исключительно для корректной работы приложения:

• Сессия пользователя (JWT-токен) — хранится в localStorage для авторизации.
• Выбранный город — запоминается для удобства.
• Языковые настройки — хранятся локально.

Мы не используем рекламные трекеры, пиксели социальных сетей или аналитику на основе cookies.

Используя наше приложение, вы соглашаетесь с использованием технических cookies, необходимых для его работы. Вы можете очистить данные приложения в настройках браузера в любой момент.`,
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const [legalOpen, setLegalOpen] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-extrabold">Вопросы и ответы</h1>
      </div>

      <div className="px-4 py-3 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          {faqs.map((item, i) => (
            <div key={i} className={i < faqs.length - 1 ? 'border-b border-gray-50' : ''}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-4 text-left gap-4"
              >
                <span className="text-sm font-medium text-gray-800 leading-snug">{item.q}</span>
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 text-gray-300 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-4 pb-4 text-sm text-gray-500 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <a
          href="https://wa.me/85251741164"
          target="_blank"
          rel="noreferrer"
          className="mt-4 bg-[#FFD600] rounded-2xl px-5 py-4 flex items-center justify-center gap-3 font-bold text-[15px] text-black active:scale-[0.98] transition-transform"
        >
          <MessageCircle size={20} strokeWidth={2} />
          Написать в WhatsApp
        </a>

        {/* Legal documents */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">Юридические документы</p>
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            {legal.map((doc, i) => (
              <div key={i} className={i < legal.length - 1 ? 'border-b border-gray-50' : ''}>
                <button
                  onClick={() => setLegalOpen(legalOpen === i ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
                    <doc.Icon size={15} className="text-gray-500" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-gray-800">{doc.title}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-gray-300 transition-transform duration-200 ${legalOpen === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {legalOpen === i && (
                  <div className="px-4 pb-5 text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                    {doc.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
