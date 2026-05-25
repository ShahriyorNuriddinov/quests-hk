import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ImagePlus, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'
import MapPicker from '../../components/MapPicker'

interface Step {
  _id?: string
  type: 'info' | 'question' | 'navigation' | 'location_info' | 'answer' | 'photo'
  title: string
  content: string
  image?: string
  images?: string[]
  options?: string[]
  answer?: string
  hint?: string
  explanation?: string
  history?: string
  facts?: string
  location?: { lat: number; lng: number; address: string }
  order: number
}

interface QuestForm {
  title: string; description: string; duration: string; distance: string
  difficulty: string; price: number; currency: string
  locationsCount: number; questionsCount: number; transportCost: string
  startPoint: string; endPoint: string; rating: number
  status: 'published' | 'draft'
}

const EMPTY: QuestForm = {
  title: '', description: '', duration: '', distance: '',
  difficulty: 'Легко', price: 99, currency: 'HK$',
  locationsCount: 0, questionsCount: 0, transportCost: '',
  startPoint: '', endPoint: '', rating: 5, status: 'draft',
}

function newStep(type: Step['type'], order: number): Step {
  if (type === 'question') return { type, title: '', content: '', options: ['', '', '', ''], answer: '', order }
  if (type === 'navigation') return { type, title: '', content: '', location: { lat: 0, lng: 0, address: '' }, order }
  if (type === 'location_info') return { type, title: '', content: '', history: '', facts: '', order }
  if (type === 'answer') return { type, title: '', content: '', explanation: '', order }
  if (type === 'photo') return { type, title: 'Сделать фото', content: '', order }
  return { type: 'info', title: '', content: '', order }
}

const TYPE_LABELS: Record<string, string> = { info: 'Информация', question: 'Вопрос', navigation: 'Навигация', location_info: 'Описание локации', answer: 'Ответ', photo: 'Фото' }
const TYPE_COLORS: Record<string, string> = { info: 'bg-blue-100 text-blue-700', question: 'bg-green-100 text-green-700', navigation: 'bg-orange-100 text-orange-700', location_info: 'bg-purple-100 text-purple-700', answer: 'bg-emerald-100 text-emerald-700', photo: 'bg-pink-100 text-pink-700' }

export default function AdminQuestEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState<QuestForm>(EMPTY)
  const [steps, setSteps] = useState<Step[]>([])
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [savingSteps, setSavingSteps] = useState(false)
  const [openStep, setOpenStep] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isNew) {
      api.get(`/admin/quests/${id}`).then(r => {
        const { coverImage: ci, steps: s, ...rest } = r.data
        setForm({ ...EMPTY, ...rest })
        setCoverImage(ci || null)
        setSteps((s || []).sort((a: Step, b: Step) => a.order - b.order))
      }).finally(() => setLoading(false))
    }
  }, [id, isNew])

  function set<K extends keyof QuestForm>(key: K, val: QuestForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function pickFile(files: FileList | null) {
    if (!files?.[0]) return
    setCoverFile(files[0])
    const reader = new FileReader()
    reader.onload = e => setCoverPreview(e.target?.result as string)
    reader.readAsDataURL(files[0])
  }

  function addStep(type: Step['type']) {
    setSteps(s => {
      const next = [...s, newStep(type, s.length + 1)]
      setOpenStep(next.length - 1)
      return next
    })
  }

  function updateStep(i: number, patch: Partial<Step>) {
    setSteps(s => s.map((st, idx) => idx === i ? { ...st, ...patch } : st))
  }

  function updateOption(stepIdx: number, optIdx: number, val: string) {
    setSteps(s => s.map((st, i) => {
      if (i !== stepIdx) return st
      const opts = [...(st.options || [])]
      opts[optIdx] = val
      return { ...st, options: opts }
    }))
  }

  function removeStep(i: number) {
    setSteps(s => s.filter((_, idx) => idx !== i).map((st, idx) => ({ ...st, order: idx + 1 })))
    if (openStep === i) setOpenStep(null)
  }

  async function saveSteps() {
    if (!id || id === 'new') return
    setSavingSteps(true)
    try {
      await api.put(`/admin/quests/${id}/steps`, steps.map((s, i) => ({ ...s, order: i + 1 })))
    } catch (e) {
      alert('Ошибка сохранения шагов!')
    } finally {
      setSavingSteps(false)
    }
  }

  async function save(status: 'published' | 'draft') {
    setSaving(true)
    try {
      const data = { ...form, status }
      let savedId = id
      if (isNew) {
        const r = await api.post('/admin/quests', data)
        savedId = r.data._id || r.data.id
      } else {
        await api.put(`/admin/quests/${id}`, data)
      }
      if (coverFile && savedId && savedId !== 'new') {
        const fd = new FormData()
        fd.append('image', coverFile)
        await api.post(`/admin/quests/${savedId}/cover`, fd)
      }
      // save steps along with quest
      if (!isNew && savedId && steps.length > 0) {
        await api.put(`/admin/quests/${savedId}/steps`, steps.map((s, i) => ({ ...s, order: i + 1 })))
      }
      navigate('/admin/quests')
    } catch (e) {
      alert('Ошибка сохранения!')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const previewSrc = coverPreview || coverImage
  const fields: [keyof QuestForm, string][] = [
    ['title', 'Название'], ['description', 'Описание'],
    ['duration', 'Длительность'], ['distance', 'Расстояние'],
    ['startPoint', 'Стартовая точка'], ['endPoint', 'Конец маршрута'],
    ['transportCost', 'Транспорт и билеты'],
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-medium">Редактор</p>
          <h1 className="text-lg font-extrabold leading-tight">{isNew ? 'Новый квест' : form.title || 'Редактировать'}</h1>
        </div>
        {!isNew && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
            form.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {form.status === 'published' ? 'Опубликован' : 'Черновик'}
          </span>
        )}
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-4">
        {/* Cover */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Обложка</label>
          <div onClick={() => fileRef.current?.click()}
            className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-200 to-yellow-400 cursor-pointer flex items-center justify-center">
            {previewSrc
              ? <img src={previewSrc} alt="" className="w-full h-full object-cover" />
              : <div className="flex flex-col items-center gap-2 text-yellow-700/70">
                  <ImagePlus size={32} />
                  <span className="text-sm font-semibold">Добавить фото</span>
                </div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => pickFile(e.target.files)} />
        </div>

        {/* Fields */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {fields.map(([key, label], i) => (
            <div key={key} className={`px-4 py-3 ${i < fields.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
              {key === 'description' ? (
                <textarea value={form[key] as string} onChange={e => set(key, e.target.value as never)} rows={3}
                  className="mt-1 w-full text-sm text-gray-800 focus:outline-none resize-none bg-transparent" />
              ) : (
                <input type="text" value={form[key] as string} onChange={e => set(key, e.target.value as never)}
                  className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent" />
              )}
            </div>
          ))}
        </div>

        {/* Price / Currency / Difficulty / Rating */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-50">
            <div className="px-4 py-3 border-b border-gray-50">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Цена</label>
              <input type="number" value={form.price} onChange={e => set('price', Number(e.target.value))}
                className="mt-1 w-full text-sm font-bold text-gray-800 focus:outline-none bg-transparent" />
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Валюта</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value as never)}
                className="mt-1 w-full text-sm font-bold text-gray-800 focus:outline-none bg-transparent">
                <option>HK$</option><option>USD</option><option>RUB</option><option>CNY</option>
              </select>
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Локаций</label>
              <input type="number" value={form.locationsCount} onChange={e => set('locationsCount', Number(e.target.value))}
                className="mt-1 w-full text-sm font-bold text-gray-800 focus:outline-none bg-transparent" />
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Вопросов</label>
              <input type="number" value={form.questionsCount} onChange={e => set('questionsCount', Number(e.target.value))}
                className="mt-1 w-full text-sm font-bold text-gray-800 focus:outline-none bg-transparent" />
            </div>
            <div className="px-4 py-3">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Сложность</label>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value as never)}
                className="mt-1 w-full text-sm font-bold text-gray-800 focus:outline-none bg-transparent">
                <option>Легко</option><option>Средне</option><option>Сложно</option>
              </select>
            </div>
            <div className="px-4 py-3">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Рейтинг</label>
              <input type="number" min={1} max={5} step={0.1} value={form.rating} onChange={e => set('rating', Number(e.target.value))}
                className="mt-1 w-full text-sm font-bold text-gray-800 focus:outline-none bg-transparent" />
            </div>
          </div>
        </div>

        {/* ---- STEPS EDITOR ---- */}
        {!isNew && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Шаги</p>
                <h2 className="text-base font-extrabold leading-tight">{steps.length > 0 ? `${steps.length} шага` : 'Нет шагов'}</h2>
              </div>
              <button onClick={saveSteps} disabled={savingSteps}
                className="bg-[#FFD600] text-black text-xs font-bold rounded-full px-4 py-2 disabled:opacity-50">
                {savingSteps ? 'Сохраняем...' : 'Сохранить шаги'}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {steps.map((step, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Step header row */}
                  <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                    onClick={() => setOpenStep(openStep === i ? null : i)}>
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-extrabold text-gray-500 flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 flex-shrink-0 ${TYPE_COLORS[step.type]}`}>
                      {TYPE_LABELS[step.type]}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate text-gray-700 min-w-0">
                      {step.title || <span className="text-gray-300">без названия</span>}
                    </span>
                    <button onClick={e => { e.stopPropagation(); removeStep(i) }}
                      className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                    {openStep === i
                      ? <ChevronUp size={15} className="text-gray-300 flex-shrink-0" />
                      : <ChevronDown size={15} className="text-gray-300 flex-shrink-0" />}
                  </div>

                  {/* Expanded editor */}
                  {openStep === i && (
                    <div className="border-t border-gray-50">
                      {/* Type selector */}
                      <div className="px-4 py-3 border-b border-gray-50">
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Тип шага</label>
                        <select value={step.type} onChange={e => {
                          const t = e.target.value as Step['type']
                          const patch: Partial<Step> = { type: t }
                          if (t === 'navigation' && !step.location) patch.location = { lat: 22.3193, lng: 114.1694, address: '' }
                          if (t === 'question' && !step.options?.length) patch.options = ['', '', '', '']
                          updateStep(i, patch)
                        }} className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent">
                          <option value="info">Информация</option>
                          <option value="question">Вопрос</option>
                          <option value="navigation">Навигация</option>
                        </select>
                      </div>

                      {/* Title */}
                      <div className="px-4 py-3 border-b border-gray-50">
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Заголовок</label>
                        <input value={step.title} onChange={e => updateStep(i, { title: e.target.value })}
                          className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent" />
                      </div>

                      {/* Content */}
                      <div className="px-4 py-3 border-b border-gray-50">
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Текст</label>
                        <textarea value={step.content} onChange={e => updateStep(i, { content: e.target.value })}
                          rows={3} className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent resize-none" />
                      </div>

                      {/* Step image */}
                      <div className="px-4 py-3 border-b border-gray-50">
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Фото (необязательно)</label>
                        {step.image ? (
                          <div className="relative rounded-xl overflow-hidden h-32">
                            <img src={step.image} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => updateStep(i, { image: undefined })}
                              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#FFD600] transition-colors">
                            <ImagePlus size={15} className="text-gray-300" />
                            <span className="text-xs text-gray-400">Загрузить фото</span>
                            <input type="file" accept="image/*" className="hidden" onChange={async e => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const fd = new FormData()
                              fd.append('image', file)
                              try {
                                const r = await api.post(`/admin/quests/${id}/step-image`, fd)
                                updateStep(i, { image: r.data.url })
                              } catch { alert('Ошибка загрузки') }
                              e.target.value = ''
                            }} />
                          </label>
                        )}
                      </div>

                      {/* Question options */}
                      {step.type === 'question' && (
                        <div className="px-4 py-3 border-b border-gray-50">
                          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Варианты ответов</label>
                          <div className="flex flex-col gap-2">
                            {(step.options || ['', '', '', '']).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name={`answer_${i}`}
                                  checked={step.answer === opt && opt !== ''}
                                  onChange={() => updateStep(i, { answer: opt })}
                                  className="accent-yellow-400 flex-shrink-0"
                                />
                                <input
                                  value={opt}
                                  onChange={e => {
                                    updateOption(i, oi, e.target.value)
                                    if (step.answer === opt) updateStep(i, { answer: e.target.value })
                                  }}
                                  placeholder={`Вариант ${oi + 1}`}
                                  className="flex-1 text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:bg-yellow-50 transition-colors"
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-300 mt-2">Отметьте радиокнопку напротив правильного ответа</p>
                        </div>
                      )}

                      {/* Hint (for question steps) */}
                      {step.type === 'question' && (
                        <div className="px-4 py-3 border-b border-gray-50">
                          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Подсказка (необязательно)</label>
                          <input value={step.hint || ''} onChange={e => updateStep(i, { hint: e.target.value })}
                            placeholder="Посмотри на табличку справа от входа..."
                            className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent" />
                        </div>
                      )}

                      {/* Navigation map */}
                      {step.type === 'navigation' && (
                        <div className="px-4 py-3">
                          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Локация</label>
                          <MapPicker
                            lat={step.location?.lat || 0}
                            lng={step.location?.lng || 0}
                            address={step.location?.address || ''}
                            onChange={(lat, lng) => updateStep(i, { location: { ...step.location!, lat, lng } })}
                            onAddressChange={addr => updateStep(i, { location: { ...step.location!, address: addr } })}
                          />
                        </div>
                      )}

                      {/* Location info fields */}
                      {step.type === 'location_info' && (
                        <>
                          <div className="px-4 py-3 border-b border-gray-50">
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">История</label>
                            <textarea value={step.history || ''} onChange={e => updateStep(i, { history: e.target.value })}
                              placeholder="Историческая справка о локации..."
                              rows={3}
                              className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent resize-none" />
                          </div>
                          <div className="px-4 py-3 border-b border-gray-50">
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Интересные факты</label>
                            <textarea value={step.facts || ''} onChange={e => updateStep(i, { facts: e.target.value })}
                              placeholder="Интересные факты о локации..."
                              rows={3}
                              className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent resize-none" />
                          </div>
                        </>
                      )}

                      {/* Answer explanation */}
                      {step.type === 'answer' && (
                        <div className="px-4 py-3 border-b border-gray-50">
                          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Объяснение ответа</label>
                          <textarea value={step.explanation || ''} onChange={e => updateStep(i, { explanation: e.target.value })}
                            placeholder="Объяснение правильного ответа..."
                            rows={3}
                            className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent resize-none" />
                        </div>
                      )}

                      {/* Close padding for non-navigation last section */}
                      {!['navigation', 'question', 'location_info', 'answer'].includes(step.type) && <div className="h-1" />}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add step buttons */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {(['navigation', 'info', 'question', 'location_info', 'answer', 'photo'] as Step['type'][]).map(type => (
                <button key={type} onClick={() => addStep(type)}
                  className={`flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold transition-colors ${TYPE_COLORS[type] || 'bg-gray-100 text-gray-600'}`}>
                  <Plus size={13} strokeWidth={2.5} /> {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        )}

        {isNew && (
          <div className="flex items-center gap-3 bg-amber-50 rounded-2xl px-4 py-3">
            <span className="text-lg">💡</span>
            <p className="text-xs text-amber-700 font-medium leading-snug">
              Сохраните квест, чтобы добавить шаги маршрута
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-100 px-4 py-3.5 flex gap-3 z-40">
        <button onClick={() => save('draft')} disabled={saving}
          className="flex-1 border-2 border-gray-200 text-gray-700 font-bold rounded-full py-3 text-sm disabled:opacity-50 active:scale-[0.98] transition-transform">
          Черновик
        </button>
        <button onClick={() => save('published')} disabled={saving}
          className="flex-2 bg-[#FFD600] text-black font-bold rounded-full px-8 py-3 text-sm disabled:opacity-50 active:scale-[0.98] transition-transform">
          {saving ? 'Сохраняем...' : 'Опубликовать'}
        </button>
      </div>

      <AdminNav />
    </div>
  )
}
