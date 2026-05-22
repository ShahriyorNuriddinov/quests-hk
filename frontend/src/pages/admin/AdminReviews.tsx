import { useEffect, useState } from 'react'
import { Star, Check, Trash2 } from 'lucide-react'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'
import { PhotoGrid } from '../../components/ImageLightbox'

interface Review {
  _id: string
  user: { email: string }
  quest: { title: string }
  rating: number
  text: string
  photos?: string[]
  createdAt: string
  approved: boolean
}

function StarRow({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} strokeWidth={0} fill={i <= n ? '#FFD600' : '#E5E7EB'} />
      ))}
    </div>
  )
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/reviews').then(r => setReviews(r.data)).finally(() => setLoading(false))
  }, [])

  async function approve(id: string) {
    await api.patch(`/admin/reviews/${id}`, { approved: true })
    setReviews(r => r.map(x => x._id === id ? { ...x, approved: true } : x))
  }

  async function remove(id: string) {
    if (!confirm('Удалить отзыв?')) return
    await api.delete(`/admin/reviews/${id}`)
    setReviews(r => r.filter(x => x._id !== id))
  }

  const pending = reviews.filter(r => !r.approved)
  const approved = reviews.filter(r => r.approved)

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-gray-400 font-medium">Модерация</p>
            <h1 className="text-xl font-extrabold">Отзывы</h1>
          </div>
          {pending.length > 0 && (
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full">
              {pending.length} ожидают
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-400 text-sm">Отзывов пока нет</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">На модерации</p>
                {pending.map(r => (
                  <ReviewCard key={r._id} r={r} onApprove={() => approve(r._id)} onDelete={() => remove(r._id)} />
                ))}
              </div>
            )}

            {/* Approved */}
            {approved.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">Опубликованы</p>
                {approved.map(r => (
                  <ReviewCard key={r._id} r={r} onDelete={() => remove(r._id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AdminNav />
    </div>
  )
}

function ReviewCard({ r, onApprove, onDelete }: {
  r: Review; onApprove?: () => void; onDelete: () => void
}) {
  return (
    <div className="bg-white rounded-2xl px-4 py-4 border border-gray-100">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#FFD600] flex items-center justify-center text-xs font-bold flex-shrink-0">
            {r.user?.email?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{r.user?.email?.split('@')[0]}</p>
            <p className="text-[11px] text-gray-400 truncate">{r.quest?.title}</p>
          </div>
        </div>
        {!r.approved
          ? <span className="text-[11px] bg-orange-50 text-orange-500 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">На модерации</span>
          : <span className="text-[11px] bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">✓ Опубликован</span>
        }
      </div>

      <StarRow n={r.rating} />
      {r.text && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.text}</p>}
      {r.photos && r.photos.length > 0 && (
        <div className="mt-2">
          <PhotoGrid photos={r.photos} />
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-[11px] text-gray-300">
          {new Date(r.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-3">
          {onApprove && (
            <button onClick={onApprove}
              className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">
              <Check size={12} /> Одобрить
            </button>
          )}
          <button onClick={onDelete}
            className="flex items-center gap-1 text-xs text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
