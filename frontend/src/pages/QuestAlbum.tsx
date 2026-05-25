import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../api/client'

interface Photo { stepIndex: number; url: string }

export default function QuestAlbum() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/quests/${id}/photos`)
      .then(r => setPhotos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3 sticky top-0 bg-white border-b border-gray-100 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-gray-900">Мои фото</h1>
          <p className="text-xs text-gray-400">
            {loading ? 'Загружаем...' : `${photos.length} фото из путешествия`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-3 pb-36">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-gray-500 font-semibold mb-1">Фото не найдены</p>
            <p className="text-xs text-gray-300 mb-8">Фотографии появятся здесь<br />после прохождения квеста</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p, i) => (
              <button
                key={i}
                onClick={() => setLightbox(p.url)}
                className="aspect-square rounded-2xl overflow-hidden active:opacity-80 transition-opacity"
              >
                <img src={p.url} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 bg-gradient-to-t from-white via-white to-transparent pt-6">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          <button
            onClick={() => navigate(`/quest/${id}/review`)}
            className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base"
          >
            Написать отзыв →
          </button>
          <button
            onClick={() => navigate('/my-quests')}
            className="text-sm text-gray-300 text-center py-2 font-medium"
          >
            Вернуться к квестам
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-[90vh] rounded-2xl object-contain" />
          <button
            className="absolute top-5 right-5 w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white text-xl"
            onClick={() => setLightbox(null)}
          >×</button>
        </div>
      )}
    </div>
  )
}
