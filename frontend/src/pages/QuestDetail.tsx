import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, Route, Gauge, MapPin, HelpCircle, Wallet, Rocket, Flag, Users, Star } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { PhotoGrid } from '../components/ImageLightbox'

interface Review {
  id: string; rating: number; text: string; photos: string[]; createdAt: string; userEmail: string
}
interface Quest {
  _id: string; title: string; description: string; duration: string; distance: string
  difficulty: string; price: number; currency: string; rating: number; completedCount: number
  reviewCount: number; locationsCount: number; questionsCount: number; transportCost: string
  startPoint: string; endPoint: string; coverImage?: string
}

function StarRow({ n, size = 12 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} strokeWidth={0} fill={i <= n ? '#FFD600' : '#E5E7EB'} />
      ))}
    </div>
  )
}

export default function QuestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [quest, setQuest] = useState<Quest | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])

  const paymentSuccess = searchParams.get('status') === 'success'

  useEffect(() => {
    api.get(`/quests/${id}`).then(r => setQuest(r.data)).finally(() => setLoading(false))
    api.get(`/quests/${id}/reviews`).then(r => setReviews(r.data))
  }, [id])

  useEffect(() => {
    if (paymentSuccess) navigate(`/quest/${id}/play`, { replace: true })
  }, [paymentSuccess, id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!quest) return <div className="p-6 text-center text-gray-400">Не найдено</div>

  const purchased = user?.purchasedQuests.includes(id!)

  return (
    <div className="min-h-screen bg-white pb-32">

      {/* Hero */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-br from-yellow-200 to-yellow-400 overflow-hidden">
          {quest.coverImage && <img src={quest.coverImage} alt={quest.title} className="w-full h-full object-cover" />}
        </div>
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/80 backdrop-blur rounded-full w-9 h-9 flex items-center justify-center shadow-sm text-gray-700">
          ←
        </button>
        {/* Rating badge */}
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Star size={11} fill="#FFD600" strokeWidth={0} />
          {quest.rating.toFixed(1)}
          {quest.reviewCount > 0 && <span className="text-white/60">({quest.reviewCount})</span>}
        </div>
      </div>

      <div className="px-4 pt-5 max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold leading-tight text-gray-900">{quest.title}</h1>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">{quest.description}</p>

        {/* Stats pills */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {quest.duration && (
            <span className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 text-xs font-medium text-gray-600 border border-gray-100">
              <Clock size={13} className="text-gray-400" /> {quest.duration}
            </span>
          )}
          {quest.distance && (
            <span className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 text-xs font-medium text-gray-600 border border-gray-100">
              <Route size={13} className="text-gray-400" /> {quest.distance}
            </span>
          )}
          {quest.difficulty && (
            <span className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 text-xs font-medium text-gray-600 border border-gray-100">
              <Gauge size={13} className="text-gray-400" /> {quest.difficulty}
            </span>
          )}
          {quest.completedCount > 0 && (
            <span className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 text-xs font-medium text-gray-600 border border-gray-100">
              <Users size={13} className="text-gray-400" /> {quest.completedCount} прошли
            </span>
          )}
        </div>

        {/* Details */}
        <div className="mt-5 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
          {[
            quest.locationsCount && { Icon: MapPin, label: 'Локации', value: `${quest.locationsCount} интересных мест` },
            quest.questionsCount && { Icon: HelpCircle, label: 'Вопросы', value: `${quest.questionsCount} раза придётся подумать` },
            quest.transportCost && { Icon: Wallet, label: 'Транспорт и билеты', value: quest.transportCost },
            quest.startPoint && { Icon: Rocket, label: 'Стартовая точка', value: quest.startPoint },
            quest.endPoint && { Icon: Flag, label: 'Конец маршрута', value: quest.endPoint },
          ].filter(Boolean).map(({ Icon, label, value }: any, i, arr) => (
            <div key={label} className={`flex items-center gap-3 px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-gray-100">
                <Icon size={15} className="text-gray-500" />
              </div>
              <div>
                <div className="text-[11px] text-gray-400 mb-0.5">{label}</div>
                <div className="text-sm font-semibold text-gray-800">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-6">
            <h2 className="text-base font-extrabold mb-3 text-gray-900">
              Отзывы <span className="text-gray-300 font-normal text-sm">({reviews.length})</span>
            </h2>
            <div className="flex flex-col gap-3">
              {reviews.map(r => (
                <div key={r.id} className="border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#FFD600] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {r.userEmail.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{r.userEmail.split('@')[0]}</div>
                      <StarRow n={r.rating} />
                    </div>
                    <span className="text-[11px] text-gray-300">
                      {new Date(r.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {r.text && <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>}
                  {r.photos?.length > 0 && (
                    <div className="mt-3">
                      <PhotoGrid photos={r.photos} /></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-gradient-to-t from-white via-white to-transparent pt-6">
        <div className="max-w-lg mx-auto">
          {purchased ? (
            <button onClick={() => navigate(`/quest/${id}/play`)}
              className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
              Начать квест →
            </button>
          ) : (
            <button onClick={() => { if (!user) { navigate(`/auth?from=/quest/${id}/pay`); return } navigate(`/quest/${id}/pay`) }}
              className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
              Купить — {quest.price} {quest.currency}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
