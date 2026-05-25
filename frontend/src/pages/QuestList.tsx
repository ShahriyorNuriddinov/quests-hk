import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, MapPin, Star } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import LangSwitcher from '../components/LangSwitcher'

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

const CITIES = [
  { code: 'hk', label: 'Гонконг', flag: '🇭🇰', active: true },
  { code: 'macau', label: 'Макао', flag: '🇲🇴', active: true },
  { code: 'guangzhou', label: 'Гуанчжоу', flag: '🇨🇳', active: false },
]

export default function QuestList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('hk')

  useEffect(() => {
    setLoading(true)
    api.get(`/quests?city=${city}`).then(r => setQuests(r.data)).finally(() => setLoading(false))
  }, [city])

  function handleBuy(questId: string) {
    if (!user) { navigate(`/auth?from=/quest/${questId}/pay`); return }
    navigate(`/quest/${questId}/pay`)
  }

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
      <div className="px-4 pt-3 pb-1 max-w-lg mx-auto">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CITIES.map(c => (
            <button
              key={c.code}
              onClick={() => c.active && setCity(c.code)}
              disabled={!c.active}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                city === c.code
                  ? 'bg-[#FFD600] text-black'
                  : c.active
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.label}</span>
              {!c.active && <span className="text-[10px] ml-1">(скоро)</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : quests.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-gray-400 text-sm">Квесты скоро появятся</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {quests.map(q => (
              <div key={q._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100">

                {/* Cover */}
                <Link to={`/quest/${q._id}`}>
                  <div className="h-52 bg-gradient-to-br from-yellow-200 to-yellow-400 overflow-hidden relative">
                    {q.coverImage && (
                      <img src={q.coverImage} alt={q.title} className="w-full h-full object-cover" />
                    )}
                    {/* Price badge */}
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                      {q.price} {q.currency}
                    </div>
                  </div>
                </Link>

                <div className="px-4 pt-3 pb-4">
                  {/* Meta row */}
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

                  {/* Actions */}
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

      <BottomNav />
    </div>
  )
}
