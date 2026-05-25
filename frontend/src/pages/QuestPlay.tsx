import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import api from '../api/client'
import { MapPin, Lightbulb, Camera, BookOpen, History, Sparkles } from 'lucide-react'

interface Step {
  _id: string
  type: 'info' | 'question' | 'navigation' | 'location_info' | 'answer' | 'photo'
  title: string
  content: string
  image?: string
  images?: string[]
  options?: string[]
  answer?: string
  correctAnswer?: number
  hint?: string
  explanation?: string
  history?: string
  facts?: string
  location?: { lat: number; lng: number; address: string }
}

function getAnswer(step: Step): string {
  if (step.answer) return step.answer
  if (step.correctAnswer !== undefined && step.options) return step.options[step.correctAnswer] ?? ''
  return ''
}

function formatElapsed(ms: number) {
  const m = Math.floor(ms / 60000)
  if (m < 60) return `${m} мин`
  return `${Math.floor(m / 60)}ч ${m % 60}мин`
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#FFD600', '#FFF', '#000'] })
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } }), 250)
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } }), 400)
}

function AchievementOverlay({ stepsCount, elapsed, hasPhotos, onContinue }: {
  stepsCount: number; elapsed: number; hasPhotos: boolean; onContinue: () => void
}) {
  useEffect(() => { fireConfetti() }, [])

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-28 h-28 rounded-full bg-[#FFD600] flex items-center justify-center text-6xl mb-6 shadow-xl">
        🏆
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Квест пройден!</h1>
      <p className="text-gray-400 text-sm mb-8">Отличная работа — вы исследовали город!</p>

      <div className="flex gap-4 mb-10">
        <div className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 min-w-[100px]">
          <div className="text-2xl font-extrabold text-gray-900">{stepsCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">шагов</div>
        </div>
        <div className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 min-w-[100px]">
          <div className="text-2xl font-extrabold text-gray-900">{formatElapsed(elapsed)}</div>
          <div className="text-xs text-gray-400 mt-0.5">времени</div>
        </div>
      </div>

      <button onClick={onContinue}
        className="w-full max-w-sm bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
        {hasPhotos ? '📸 Посмотреть фото →' : 'Оставить отзыв →'}
      </button>
    </div>
  )
}

export default function QuestPlay() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [steps, setSteps] = useState<Step[]>([])
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [questTitle, setQuestTitle] = useState('')
  const [current, setCurrent] = useState(-1)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [wrongModal, setWrongModal] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const [showAchievement, setShowAchievement] = useState(false)
  const [showAlbum, setShowAlbum] = useState(false)
  const [loading, setLoading] = useState(true)
  const startTimeRef = useRef<number>(Date.now())
  const elapsedRef = useRef<number>(0)

  useEffect(() => {
    Promise.all([
      api.get(`/quests/${id}/steps`),
      api.get(`/quests/${id}/progress`),
      api.get(`/quests/${id}`),
    ]).then(([stepsRes, progRes, questRes]) => {
      setSteps(stepsRes.data)
      setCoverImage(questRes.data.coverImage || null)
      setQuestTitle(questRes.data.title || '')
      const { progress, completed } = progRes.data
      if (completed) {
        navigate(`/quest/${id}/album`)
      } else if (progress) {
        setCurrent(progress.current ?? -1)
      }
    }).catch(err => {
      if (err?.response?.status === 403) {
        navigate(`/quest/${id}/pay`, { replace: true })
      }
    }).finally(() => setLoading(false))
  }, [id])

  // Reset hint when step changes
  useEffect(() => { setHintVisible(false) }, [current])

  function next() {
    setSelected(null)
    setRevealed(false)
    if (current + 1 >= steps.length) {
      elapsedRef.current = Date.now() - startTimeRef.current
      api.post(`/quests/${id}/complete`).catch(() => {})
      setShowAchievement(true)
    } else {
      const n = current + 1
      setCurrent(n)
      api.put(`/quests/${id}/progress`, { current: n, total: steps.length }).catch(() => {})
    }
  }

  function choose(opt: string, answer: string) {
    if (revealed) return
    setSelected(opt)
    if (opt === answer) {
      setRevealed(true)
    } else {
      setWrongModal(true)
    }
  }

  function startQuest() {
    startTimeRef.current = Date.now()
    setCurrent(0)
    api.put(`/quests/${id}/progress`, { current: 0, total: steps.length }).catch(() => {})
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!steps.length) return (
    <div className="flex items-center justify-center min-h-screen p-8 text-center">
      <div>
        <div className="text-5xl mb-4">🗺️</div>
        <p className="text-gray-400">Шаги квеста не найдены</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-gray-400 underline">Назад</button>
      </div>
    </div>
  )

  const photoStepCount = steps.filter(s => s.type === 'photo').length

  if (showAlbum) return (
    <PhotoAlbumScreen
      questId={id!}
      onReview={() => navigate(`/quest/${id}/review`)}
      onSkip={() => navigate('/quests')}
    />
  )

  if (showAchievement) return (
    <AchievementOverlay
      stepsCount={steps.length}
      elapsed={elapsedRef.current}
      hasPhotos={photoStepCount > 0}
      onContinue={() => {
        if (photoStepCount > 0) {
          setShowAchievement(false)
          setShowAlbum(true)
        } else {
          navigate(`/quest/${id}/review`)
        }
      }}
    />
  )

  // ── INTRO SCREEN ──────────────────────────────────────────────
  if (current === -1) {
    const locCount = steps.filter(s => s.type === 'navigation').length
    const qCount = steps.filter(s => s.type === 'question').length
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-full max-w-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-3">{questTitle}</p>
          <div className="rounded-3xl overflow-hidden mb-6 shadow-lg">
            {coverImage
              ? <img src={coverImage} alt={questTitle} className="w-full h-56 object-cover" />
              : <div className="h-56 bg-gradient-to-br from-yellow-200 to-yellow-400" />
            }
          </div>
          <h1 className="text-3xl font-extrabold mb-3">Начнём?</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Вас ждёт {locCount > 0 ? `${locCount} локаций` : ''}{locCount > 0 && qCount > 0 ? ', ' : ''}{qCount > 0 ? `${qCount} вопросов` : ''}.
            Никуда не спешите, здесь нет таймера, но и вернуться назад будет нельзя.
          </p>
          <div className="flex justify-center gap-4 mb-6 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} /> Маршрут
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen size={13} /> Факты
            </div>
            <div className="flex items-center gap-1.5">
              <Lightbulb size={13} /> Вопросы
            </div>
            <div className="flex items-center gap-1.5">
              <Camera size={13} /> Фото
            </div>
          </div>
          <button onClick={startQuest}
            className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
            Я готов! Начать
          </button>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm text-gray-300">
            ← Назад
          </button>
        </div>
      </div>
    )
  }

  const step = steps[current]
  const progress = ((current + 1) / steps.length) * 100

  // ── QUESTION STEP ─────────────────────────────────────────────
  if (step.type === 'question') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ProgressBar progress={progress} current={current} total={steps.length} onBack={() => navigate(-1)} />
        <div className="flex-1 px-6 py-8 flex flex-col max-w-lg mx-auto w-full">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-2">Вопрос на засыпку</p>
          <h2 className="text-xl font-extrabold mb-1">{step.title}</h2>
          {step.content && <p className="text-sm text-gray-400 italic mb-6">{step.content}</p>}
          <div className="flex flex-col gap-3">
            {(step.options || []).map(opt => {
              const correctAns = getAnswer(step)
              const isCorrect = opt === correctAns
              const isSelected = opt === selected
              let cls = 'rounded-2xl px-5 py-4 text-sm font-semibold text-left transition-all border-2 '
              if (!revealed) cls += 'border-gray-100 bg-gray-50 text-gray-800 active:border-[#FFD600]'
              else if (isCorrect) cls += 'border-green-400 bg-green-50 text-green-700'
              else if (isSelected) cls += 'border-red-300 bg-red-50 text-red-600'
              else cls += 'border-gray-100 bg-gray-50 text-gray-300'
              return (
                <button key={opt} onClick={() => choose(opt, correctAns)} className={cls}>{opt}</button>
              )
            })}
          </div>

          {/* Hint */}
          {step.hint && !revealed && (
            <div className="mt-5">
              {hintVisible ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                  <Lightbulb size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 leading-relaxed">{step.hint}</p>
                </div>
              ) : (
                <button onClick={() => setHintVisible(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mx-auto">
                  <Lightbulb size={13} />
                  Нужна подсказка?
                </button>
              )}
            </div>
          )}

          {revealed && (
            <button onClick={next}
              className="mt-8 w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
              {current + 1 >= steps.length ? 'Завершить квест 🎉' : 'Далее →'}
            </button>
          )}
        </div>

        {/* Wrong answer modal */}
        {wrongModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
              <div className="text-5xl mb-4">🤔</div>
              <h3 className="text-xl font-extrabold mb-2">Будь внимательнее!</h3>
              <p className="text-sm text-gray-400 mb-6">Посмотри на локацию ещё раз,<br />правильный ответ где-то рядом.</p>
              <button
                onClick={() => { setWrongModal(false); setSelected(null) }}
                className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── NAVIGATION STEP ───────────────────────────────────────────
  if (step.type === 'navigation') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ProgressBar progress={progress} current={current} total={steps.length} onBack={() => navigate(-1)} />
        <div className="flex-1 px-6 py-6 flex flex-col max-w-lg mx-auto w-full">
          {step.image ? (
            <div className="rounded-3xl overflow-hidden mb-6 shadow-sm">
              <img src={step.image} alt={step.title} className="w-full h-52 object-cover" />
            </div>
          ) : (
            <div className="rounded-3xl bg-gradient-to-br from-yellow-100 to-yellow-300 h-52 mb-6 flex items-center justify-center">
              <MapPin size={40} className="text-yellow-600 opacity-50" />
            </div>
          )}
          {step.location?.address && (
            <p className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-1">{step.location.address}</p>
          )}
          <h2 className="text-2xl font-extrabold mb-2">{step.title}</h2>
          {step.content && <p className="text-sm text-gray-500 leading-relaxed mb-6">{step.content}</p>}
          {step.location && (
            <a
              href={`https://maps.google.com/?q=${step.location.lat},${step.location.lng}`}
              target="_blank" rel="noreferrer"
              className="bg-gray-50 rounded-2xl px-5 py-4 flex items-center gap-3 mb-6 border border-gray-100"
            >
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-sm font-bold text-gray-800">Показать на карте</p>
                <p className="text-xs text-[#FFD600] font-medium mt-0.5">Открыть Google Maps →</p>
              </div>
            </a>
          )}
          {step.images && step.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {step.images.map((img, idx) => (
                <img key={idx} src={img} alt={`Фото ${idx + 1}`}
                  className="w-28 h-20 rounded-xl object-cover flex-shrink-0" />
              ))}
            </div>
          )}
        </div>
        <div className="px-6 pb-8 max-w-lg mx-auto w-full">
          <button onClick={next}
            className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
            {current + 1 >= steps.length ? 'Завершить квест 🎉' : 'Я на месте →'}
          </button>
        </div>
      </div>
    )
  }

  // ── LOCATION INFO STEP ───────────────────────────────────────
  if (step.type === 'location_info') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ProgressBar progress={progress} current={current} total={steps.length} onBack={() => navigate(-1)} />
        <div className="flex-1 px-6 py-6 pb-32 flex flex-col max-w-lg mx-auto w-full">
          {step.image && (
            <div className="rounded-3xl overflow-hidden mb-6 shadow-sm">
              <img src={step.image} alt={step.title} className="w-full h-52 object-cover" />
            </div>
          )}
          <h2 className="text-2xl font-extrabold mb-4">{step.title}</h2>

          {step.content && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-blue-500" />
                <span className="text-sm font-bold text-gray-700">Описание</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{step.content}</p>
            </div>
          )}

          {step.history && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <History size={16} className="text-amber-500" />
                <span className="text-sm font-bold text-gray-700">История</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{step.history}</p>
            </div>
          )}

          {step.facts && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-purple-500" />
                <span className="text-sm font-bold text-gray-700">Интересные факты</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{step.facts}</p>
            </div>
          )}
        </div>
        <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-white via-white to-transparent pt-6">
          <div className="max-w-lg mx-auto">
            <button onClick={next}
              className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
              {current + 1 >= steps.length ? 'Завершить квест 🎉' : 'Далее →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ANSWER STEP ─────────────────────────────────────────────
  if (step.type === 'answer') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ProgressBar progress={progress} current={current} total={steps.length} onBack={() => navigate(-1)} />
        <div className="flex-1 px-6 py-6 pb-32 flex flex-col max-w-lg mx-auto w-full">
          <p className="text-center text-[#FFD600] text-2xl font-extrabold mb-4">Верно!</p>
          {step.image && (
            <div className="rounded-3xl overflow-hidden mb-6 shadow-sm">
              <img src={step.image} alt={step.title} className="w-full h-52 object-cover" />
            </div>
          )}
          <h2 className="text-xl font-extrabold mb-3">{step.title}</h2>
          {step.content && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-4">{step.content}</p>
          )}
          {step.explanation && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-4">
              <p className="text-sm font-bold text-green-700 mb-1">Объяснение</p>
              <p className="text-sm text-green-800 leading-relaxed whitespace-pre-line">{step.explanation}</p>
            </div>
          )}
        </div>
        <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-white via-white to-transparent pt-6">
          <div className="max-w-lg mx-auto">
            <button onClick={next}
              className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
              {current + 1 >= steps.length ? 'Завершить квест 🎉' : 'Далее →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── PHOTO STEP ──────────────────────────────────────────────
  if (step.type === 'photo') {
    return <PhotoStep step={step} progress={progress} current={current} total={steps.length} questId={id!} onBack={() => navigate(-1)} onNext={next} />
  }

  // ── INFO STEP ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProgressBar progress={progress} current={current} total={steps.length} onBack={() => navigate(-1)} />
      <div className="flex-1 px-6 py-6 pb-32 flex flex-col max-w-lg mx-auto w-full">
        {step.image && (
          <div className="rounded-3xl overflow-hidden mb-6 shadow-sm">
            <img src={step.image} alt={step.title} className="w-full max-h-64 object-cover" />
          </div>
        )}
        <h2 className="text-2xl font-extrabold mb-3">{step.title}</h2>
        {step.content && (
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{step.content}</p>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-white via-white to-transparent pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={next}
            className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
            {current + 1 >= steps.length ? 'Завершить квест 🎉' : 'Далее →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PhotoStep({ step, progress, current, total, questId, onBack, onNext }: {
  step: Step; progress: number; current: number; total: number
  questId: string; onBack: () => void; onNext: () => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setUploadError(false)
    try {
      const form = new FormData()
      form.append('photo', file)
      form.append('stepIndex', String(current))
      await api.post(`/quests/${questId}/photos`, form)
    } catch {
      setUploadError(true)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProgressBar progress={progress} current={current} total={total} onBack={onBack} />
      <div className="flex-1 px-6 py-6 pb-32 flex flex-col max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Camera size={24} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-extrabold">{step.title || 'Сделать фото'}</h2>
        </div>
        {step.content && (
          <p className="text-sm text-gray-500 leading-relaxed mb-6 italic">{step.content}</p>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

        {preview ? (
          <div className="relative rounded-3xl overflow-hidden mb-4 shadow-sm">
            <img src={preview} alt="Ваше фото" className="w-full h-64 object-cover" />
            <button
              onClick={() => { setPreview(null); setUploadError(false); if (fileRef.current) fileRef.current.value = '' }}
              className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg leading-none"
            >×</button>
            {uploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {uploadError && (
              <div className="absolute bottom-3 left-3 right-3 bg-red-500/90 rounded-xl px-3 py-1.5 text-white text-xs font-medium text-center">
                Не удалось сохранить — можно продолжить
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-3xl h-48 flex flex-col items-center justify-center gap-3 mb-4 active:bg-gray-50 transition-colors"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FFD600]/20 flex items-center justify-center">
              <Camera size={28} className="text-[#FFD600]" />
            </div>
            <span className="text-sm font-semibold text-gray-500">Нажмите, чтобы сделать фото</span>
            <span className="text-xs text-gray-300">или выберите из галереи</span>
          </button>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-white via-white to-transparent pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={onNext} disabled={uploading}
            className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base disabled:opacity-60">
            {uploading ? 'Сохраняем фото...' : current + 1 >= total ? 'Завершить квест 🎉' : 'Готово! Идём дальше →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PhotoAlbumScreen({ questId, onReview, onSkip }: {
  questId: string; onReview: () => void; onSkip: () => void
}) {
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/quests/${questId}/photos`)
      .then(r => setPhotos((r.data as { url: string }[]).map(p => p.url)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [questId])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-6 pt-12 pb-6 text-center bg-gradient-to-b from-yellow-50 to-white">
        <div className="text-5xl mb-3">📸</div>
        <h1 className="text-2xl font-extrabold text-gray-900">Ваши фото</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? 'Загружаем...' : photos.length > 0 ? `${photos.length} фото из путешествия` : 'Фото не найдены'}
        </p>
      </div>

      <div className="flex-1 px-4 pb-40">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-gray-400 text-sm">Фотографии не были сделаны</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((url, i) => (
              <button key={i} onClick={() => setLightbox(url)}
                className="aspect-square rounded-2xl overflow-hidden active:opacity-80">
                <img src={url} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 bg-gradient-to-t from-white via-white to-transparent pt-6">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          <button onClick={onReview}
            className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
            Написать отзыв →
          </button>
          <button onClick={onSkip} className="text-sm text-gray-300 text-center py-2 font-medium">
            Пропустить
          </button>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  )
}

function ProgressBar({ progress, current, total, onBack }: {
  progress: number; current: number; total: number; onBack: () => void
}) {
  return (
    <div className="px-4 pt-4 pb-2 flex items-center gap-3 bg-white">
      <button onClick={onBack} className="text-gray-300 text-xl leading-none">←</button>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className="bg-[#FFD600] h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-xs text-gray-300 font-medium tabular-nums">{current + 1}/{total}</span>
    </div>
  )
}
