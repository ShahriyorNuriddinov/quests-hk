import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import api from '../api/client'
import BottomNav from '../components/BottomNav'
import { PhotoGrid } from '../components/ImageLightbox'

interface Review {
  id: string
  rating: number
  text: string
  photos?: string[]
  createdAt: string
  user: { email: string }
  quest: { title: string }
}

function initials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

function StarRow({ n, size = 13 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} strokeWidth={0}
          fill={i <= n ? '#FFD600' : '#E5E7EB'} />
      ))}
    </div>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reviews').then(r => setReviews(r.data)).finally(() => setLoading(false))
  }, [])

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-extrabold">Отзывы</h1>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">

        {/* Summary */}
        {!loading && avg && (
          <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 flex items-center gap-4">
            <div className="text-4xl font-extrabold text-gray-900 tracking-tight">{avg}</div>
            <div>
              <StarRow n={Math.round(parseFloat(avg))} size={16} />
              <p className="text-xs text-gray-400 mt-1.5">
                {reviews.length} {reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-400 text-sm">Пока нет отзывов</p>
          </div>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl px-4 py-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#FFD600] flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                  {initials(r.user?.email || 'AN')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {r.user?.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{r.quest?.title}</div>
                </div>
                <StarRow n={r.rating} />
              </div>

              {r.text && (
                <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
              )}

              {r.photos?.length ? (
                <div className="mt-3">
                  <PhotoGrid photos={r.photos} /></div>
              ) : null}

              <p className="text-[11px] text-gray-300 mt-2.5">
                {new Date(r.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
