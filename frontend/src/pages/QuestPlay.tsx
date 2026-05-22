import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import api from '../api/client'
import { MapPin, Lightbulb } from 'lucide-react'

interface Step {
  _id: string
  type: 'info' | 'question' | 'navigation'
  title: string
  content: string
  image?: string
  options?: string[]
  answer?: string
  correctAnswer?: number
  hint?: string
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

function AchievementOverlay({ stepsCount, elapsed, onContinue }: {
  stepsCount: number; elapsed: number; onContinue: () => void
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
        Оставить отзыв →
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
        navigate(`/quest/${id}/review`)
      } else if (progress) {
        setCurrent(progress.current ?? -1)
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

  if (showAchievement) return (
    <AchievementOverlay
      stepsCount={steps.length}
      elapsed={elapsedRef.current}
      onContinue={() => navigate(`/quest/${id}/review`)}
    />
  )

  // ── INTRO SCREEN ──────────────────────────────────────────────
  if (current === -1) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl overflow-hidden mb-8 shadow-lg">
            {coverImage
              ? <img src={coverImage} alt={questTitle} className="w-full h-56 object-cover" />
              : <div className="h-56 bg-gradient-to-br from-yellow-200 to-yellow-400" />
            }
          </div>
          <h1 className="text-3xl font-extrabold mb-3">Готовы к приключению?</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Мы отправляемся в путь. Внимательно читайте историю и ищите подсказки на самих зданиях!
          </p>
          <button onClick={startQuest}
            className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base">
            Я готов!
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
                <p className="text-sm font-bold text-gray-800">Как найти?</p>
                <p className="text-xs text-[#FFD600] font-medium mt-0.5">Открыть Google Maps →</p>
              </div>
            </a>
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
