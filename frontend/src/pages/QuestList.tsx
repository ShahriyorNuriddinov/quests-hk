import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, MapPin, Star, Search, X, SortAsc, Bell } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import LangSwitcher from '../components/LangSwitcher'

interface AppEvent { id: string; title: string; text: string | null; imageUrl: string | null }

interface Quest {
  _id: string
  title: string
  description: string
  duration: string
  distance: string
  price: number
  currency: string
  rating: number
  completedCount: number
  coverImage?: string
}

interface City {
  _id: string
  code: string
  name: string
  flag: string
  active: boolean
}

type SortKey = 'rating' | 'price_asc' | 'price_desc'

export default function QuestList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState(localStorage.getItem('city') || 'hk')
  const [cities, setCities] = useState<City[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('rating')
  const [notifyCity, setNotifyCity] = useState<City | null>(null)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyDone, setNotifyDone] = useState<string | null>(null)
  const [notifySending, setNotifySending] = useState(false)
  const [events, setEvents] = useState<AppEvent[]>([])

  useEffect(() => {
    api.get('/events').then(r => setEvents(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/quests/cities').then(r => setCities(r.data)).catch(() => {
      setCities([
        { _id: '1', code: 'hk', name: 'Hong Kong', flag: '🇭🇰', active: true },
        { _id: '2', code: 'macau', name: 'Macau', flag: '🇲🇴', active: false },
        { _id: '3', code: 'guangzhou', name: 'Guangzhou', flag: '🇨🇳', active: false },
      ])
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    api.get(`/quests?city=${city}`).then(r => setQuests(r.data)).finally(() => setLoading(false))
  }, [city])

  function handleBuy(questId: string) {
    if (!user) { navigate(`/auth?from=/quest/${questId}/pay`); return }
    navigate(`/quest/${questId}/pay`)
  }

  function openNotify(c: City) {
    setNotifyCity(c)
    setNotifyEmail(user?.email || '')
    setNotifyDone(null)
  }

  async function submitNotify() {
    if (!notifyEmail.trim() || !notifyCity) return
    setNotifySending(true)
    try {
      await api.post('/users/notify-city', { email: notifyEmail.trim(), cityCode: notifyCity.code })
      setNotifyDone(notifyCity.name)
    } catch {}
    setNotifySending(false)
  }

  const filtered = quests
    .filter(q => !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price
      if (sort === 'price_desc') return b.price - a.price
      return b.rating - a.rating
    })

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-extrabold tracking-tight">Квест-Экскурсии</h1>
        <div className="flex items-center gap-2">
          <Link to="/reviews" className="flex items-center gap-1 text-xs text-gray-400">
            <Star size={12} fill="#FFD600" strokeWidth={0} />
            Отзывы
          </Link>
          <LangSwitcher />
        </div>
      </div>

      {/* City selector */}
      {cities.length > 0 && (
        <div className="px-4 pt-3 pb-1 max-w-lg mx-auto">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {cities.map(c => (
              <div key={c.code} className="flex-shrink-0 flex items-center gap-1.5">
                <button
                  onClick={() => { if (c.active) { setCity(c.code); localStorage.setItem('city', c.code) } }}
                  disabled={!c.active}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    city === c.code
                      ? 'bg-[#FFD600] text-black'
                      : c.active
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <span className="text-xs font-bold uppercase">{c.flag || c.code.slice(0, 2)}</span>
                  <span>{c.name}</span>
                  {!c.active && <span className="text-[10px] ml-1">(скоро)</span>}
                </button>
                {!c.active && (
                  <button
                    onClick={() => openNotify(c)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                    title="Уведомить о запуске"
                  >
                    <Bell size={13} className="text-gray-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Sort */}
      <div className="px-4 pt-3 pb-1 max-w-lg mx-auto flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск квестов..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-8 py-2.5 text-sm focus:outline-none focus:border-[#FFD600] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={13} className="text-gray-400" />
            </button>
          )}
        </div>
        <div className="relative">
          <SortAsc size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="bg-white border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:border-[#FFD600] appearance-none transition-colors"
          >
            <option value="rating">По рейтингу</option>
            <option value="price_asc">Дешевле</option>
            <option value="price_desc">Дороже</option>
          </select>
        </div>
      </div>

      {/* Events banner */}
      {events.length > 0 && (
        <div className="px-4 pt-2 max-w-lg mx-auto">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {events.map(ev => (
              <div key={ev.id} className="flex-shrink-0 w-64 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {ev.imageUrl && (
                  <div className="h-28 overflow-hidden">
                    <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="px-3 py-2.5">
                  <p className="font-bold text-[13px] text-gray-900 leading-snug">{ev.title}</p>
                  {ev.text && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{ev.text}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">{search ? '🔍' : '🗺️'}</div>
            <p className="text-gray-400 text-sm">
              {search ? `Квесты по запросу «${search}» не найдены` : 'Квесты скоро появятся'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-4 text-sm text-[#B8A000] font-semibold">
                Сбросить поиск
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(q => (
              <div key={q._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100">

                {/* Cover */}
                <Link to={`/quest/${q._id}`}>
                  <div className="h-52 bg-gradient-to-br from-yellow-200 to-yellow-400 overflow-hidden relative">
                    {q.coverImage && (
                      <img src={q.coverImage} alt={q.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                      {q.price} {q.currency}
                    </div>
                  </div>
                </Link>

                <div className="px-4 pt-3 pb-4">
                  <div className="flex items-center gap-3 mb-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Star size={11} fill="#FFD600" strokeWidth={0} />
                      {q.rating.toFixed(1)}
                    </span>
                    {q.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {q.duration}
                      </span>
                    )}
                    {q.distance && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {q.distance}
                      </span>
                    )}
                    {q.completedCount > 0 && (
                      <span className="ml-auto">{q.completedCount} прошли</span>
                    )}
                  </div>

                  <h2 className="font-bold text-[16px] leading-snug text-gray-900">{q.title}</h2>
                  <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{q.description}</p>

                  <div className="flex gap-2 mt-3">
                    {user?.purchasedQuests.includes(q._id) ? (
                      <Link
                        to={`/quest/${q._id}/play`}
                        className="flex-1 bg-[#FFD600] text-black text-sm font-bold rounded-2xl py-3 text-center"
                      >
                        Начать →
                      </Link>
                    ) : (
                      <>
                        <Link
                          to={`/quest/${q._id}`}
                          className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl py-3 text-center"
                        >
                          Подробнее
                        </Link>
                        <button
                          onClick={() => handleBuy(q._id)}
                          className="flex-1 bg-[#FFD600] text-black text-sm font-bold rounded-2xl py-3"
                        >
                          Купить {q.price} {q.currency}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notify City Modal */}
      {notifyCity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setNotifyCity(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            {notifyDone ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="font-extrabold text-lg text-gray-900 mb-1">Готово!</h3>
                <p className="text-sm text-gray-400">
                  Уведомим, когда {notifyDone} появится на платформе
                </p>
                <button onClick={() => setNotifyCity(null)} className="mt-5 w-full bg-[#FFD600] font-bold rounded-2xl py-3 text-sm">
                  Закрыть
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <div className="text-4xl mb-2">{notifyCity.flag}</div>
                  <h3 className="font-extrabold text-lg text-gray-900">{notifyCity.name} — скоро!</h3>
                  <p className="text-sm text-gray-400 mt-1">Оставь email — сообщим о запуске первым</p>
                </div>
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#FFD600] mb-3"
                />
                <button
                  onClick={submitNotify}
                  disabled={notifySending || !notifyEmail.trim()}
                  className="w-full bg-[#FFD600] font-bold rounded-2xl py-3.5 text-sm disabled:opacity-50"
                >
                  {notifySending ? 'Отправляем...' : 'Уведомить меня'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
