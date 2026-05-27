import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search, Bell } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

interface City {
  _id: string
  code: string
  name: string
  flag: string
  active: boolean
  country: string | null
  countryCode: string | null
  coverImage: string | null
  questCount: number
}

export default function Cities() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [notifyCity, setNotifyCity] = useState<City | null>(null)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyDone, setNotifyDone] = useState(false)
  const [notifySending, setNotifySending] = useState(false)

  useEffect(() => {
    api.get('/quests/cities').then(r => setCities(r.data)).finally(() => setLoading(false))
  }, [])

  function selectCity(city: City) {
    if (!city.active) return
    localStorage.setItem('city', city.code)
    navigate(`/?city=${city.code}`)
  }

  async function submitNotify() {
    if (!notifyEmail.trim() || !notifyCity) return
    setNotifySending(true)
    try {
      await api.post('/users/notify-city', { email: notifyEmail.trim(), cityCode: notifyCity.code })
      setNotifyDone(true)
    } catch {}
    setNotifySending(false)
  }

  const filtered = cities.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.country || '').toLowerCase().includes(search.toLowerCase())
  )

  // Group by country
  const groups: Record<string, City[]> = {}
  for (const c of filtered) {
    const key = c.country || 'Другие'
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-gray-400 font-medium mb-0.5">Направления</p>
          <h1 className="text-xl font-extrabold leading-tight">Выберите город</h1>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 max-w-lg mx-auto">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск города или страны..."
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#FFD600] transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-2 max-w-lg mx-auto flex flex-col gap-6">
          {Object.entries(groups).map(([country, citiesInGroup]) => (
            <div key={country}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 mb-3">
                {country}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {citiesInGroup.map(city => (
                  <div
                    key={city.code}
                    onClick={() => city.active ? selectCity(city) : setNotifyCity(city)}
                    className={`relative rounded-2xl overflow-hidden border border-gray-100 cursor-pointer active:scale-[0.97] transition-transform ${
                      !city.active ? 'opacity-80' : ''
                    }`}
                    style={{ height: 130 }}
                  >
                    {/* Cover image */}
                    {city.coverImage ? (
                      <img src={city.coverImage} alt={city.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-200 to-yellow-400" />
                    )}

                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Quest count badge */}
                    {city.active && city.questCount > 0 && (
                      <div className="absolute top-2.5 right-2.5 bg-[#FFD600] text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {city.questCount} {city.questCount === 1 ? 'квест' : 'квеста'}
                      </div>
                    )}

                    {/* Coming soon badge */}
                    {!city.active && (
                      <div className="absolute top-2.5 right-2.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        скоро
                      </div>
                    )}

                    {/* City info */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-white font-extrabold text-[14px] leading-tight">{city.name}</p>
                          <p className="text-white/60 text-[10px] mt-0.5 flex items-center gap-1">
                            <span>{city.flag}</span>
                          </p>
                        </div>
                        {!city.active && (
                          <button
                            onClick={e => { e.stopPropagation(); setNotifyCity(city); setNotifyEmail(user?.email || ''); setNotifyDone(false) }}
                            className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                          >
                            <Bell size={12} className="text-white" />
                          </button>
                        )}
                        {city.active && (
                          <MapPin size={14} className="text-white/60" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groups).length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-400 text-sm">Ничего не найдено</p>
            </div>
          )}
        </div>
      )}

      {/* Notify modal */}
      {notifyCity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4"
          onClick={() => setNotifyCity(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            {notifyDone ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="font-extrabold text-lg">Готово!</h3>
                <p className="text-sm text-gray-400 mt-1">Уведомим о запуске в {notifyCity.name}</p>
                <button onClick={() => setNotifyCity(null)}
                  className="mt-5 w-full bg-[#FFD600] font-bold rounded-2xl py-3 text-sm">
                  Закрыть
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <div className="text-4xl mb-2">{notifyCity.flag}</div>
                  <h3 className="font-extrabold text-lg">{notifyCity.name} — скоро!</h3>
                  <p className="text-sm text-gray-400 mt-1">Оставьте email — сообщим о запуске первым</p>
                </div>
                <input type="email" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#FFD600] mb-3" />
                <button onClick={submitNotify} disabled={notifySending || !notifyEmail.trim()}
                  className="w-full bg-[#FFD600] font-bold rounded-2xl py-3.5 text-sm disabled:opacity-50">
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
