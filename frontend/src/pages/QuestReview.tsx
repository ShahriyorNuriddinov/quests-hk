import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ImagePlus, X } from 'lucide-react'
import api from '../api/client'

const LABELS = ['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично!']

export default function QuestReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [rating, setRating] = useState(5)
  const [hovered, setHovered] = useState(0)
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function addPhotos(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 4 - photos.length)
    setPhotos(p => [...p, ...newFiles])
    newFiles.forEach(f => {
      const r = new FileReader()
      r.onload = e => setPreviews(p => [...p, e.target?.result as string])
      r.readAsDataURL(f)
    })
  }

  function removePhoto(i: number) {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
  }

  async function submit() {
    if (!text.trim()) return
    setSending(true)
    try {
      const form = new FormData()
      form.append('questId', id!)
      form.append('rating', String(rating))
      form.append('text', text)
      photos.forEach(p => form.append('photos', p))
      await api.post('/reviews', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setDone(true)
      setTimeout(() => navigate('/quests'), 2500)
    } catch {
      setSending(false)
    }
  }

  async function share() {
    const text = `Я прошёл квест-экскурсию по Гонконгу! 🏆 Исследуй город сам: ${window.location.origin}`
    if (navigator.share) {
      await navigator.share({ title: 'QUESTS HK', text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-[#FFD600] flex items-center justify-center text-5xl mb-6 shadow-lg">
          🎉
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Спасибо за отзыв!</h2>
        <p className="text-gray-400 text-sm mb-8">Расскажи друзьям о своём приключении</p>
        <button onClick={share}
          className="w-full max-w-xs bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base mb-3">
          {copied ? '✓ Ссылка скопирована!' : 'Поделиться результатом'}
        </button>
        <button onClick={() => navigate('/quests')} className="text-sm text-gray-300 font-medium py-2">
          Вернуться к квестам
        </button>
      </div>
    )
  }

  const activeRating = hovered || rating

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Hero */}
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 px-6 pt-12 pb-8 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
          Квест пройден!
        </h1>
        <p className="text-gray-400 text-sm mt-1.5">Расскажи, как всё прошло</p>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full">

        {/* Stars */}
        <div className="bg-gray-50 rounded-2xl px-5 py-5 border border-gray-100">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Твоя оценка</p>
          <div className="flex justify-center gap-3 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform active:scale-90"
              >
                <Star
                  size={36}
                  strokeWidth={0}
                  fill={s <= activeRating ? '#FFD600' : '#E5E7EB'}
                  className="transition-all duration-100"
                />
              </button>
            ))}
          </div>
          {activeRating > 0 && (
            <p className="text-center text-sm font-bold text-gray-700">{LABELS[activeRating]}</p>
          )}
        </div>

        {/* Text */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Впечатления</p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            placeholder="Напиши честный отзыв о квесте и своих впечатлениях. Нам это важно для улучшения проекта."
            className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm resize-none focus:outline-none focus:border-[#FFD600] transition-colors text-gray-800 placeholder:text-gray-300 leading-relaxed"
          />
        </div>

        {/* Photos */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Фото</p>
          <p className="text-xs text-gray-400 mb-3">Прикрепи 2–4 фото с разных локаций</p>
          <div className="flex gap-2 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 active:bg-gray-50 transition-colors flex-shrink-0"
              >
                <ImagePlus size={20} />
                <span className="text-[10px] font-medium">{photos.length}/4</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => addPhotos(e.target.files)} />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-10 pt-2 max-w-lg mx-auto w-full flex flex-col gap-3">
        <button
          onClick={submit}
          disabled={sending || !text.trim()}
          className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base disabled:opacity-40 transition-opacity"
        >
          {sending ? 'Отправляем...' : 'Отправить отзыв'}
        </button>
        <button
          onClick={() => navigate('/quests')}
          className="text-sm text-gray-300 text-center py-2 font-medium"
        >
          Пропустить
        </button>
      </div>
    </div>
  )
}
