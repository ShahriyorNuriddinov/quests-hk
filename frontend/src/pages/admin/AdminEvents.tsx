import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, ImagePlus, X } from 'lucide-react'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'

interface AppEvent {
  id: string
  title: string
  text: string | null
  imageUrl: string | null
  active: boolean
  sortOrder: number
  createdAt: string
}


export default function AdminEvents() {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<null | 'create' | AppEvent>(null)

  useEffect(() => {
    api.get('/admin/events').then(r => setEvents(r.data)).finally(() => setLoading(false))
  }, [])

  async function toggleActive(e: AppEvent) {
    const updated = await api.put(`/admin/events/${e.id}`, { active: String(!e.active) })
    setEvents(prev => prev.map(x => x.id === e.id ? updated.data : x))
  }

  async function deleteEvent(id: string) {
    if (!confirm('Удалить событие?')) return
    await api.delete(`/admin/events/${id}`)
    setEvents(prev => prev.filter(x => x.id !== id))
  }

  function onSaved(ev: AppEvent, isNew: boolean) {
    if (isNew) setEvents(prev => [ev, ...prev])
    else setEvents(prev => prev.map(x => x.id === ev.id ? ev : x))
    setModal(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-gray-400 font-medium">Контент</p>
            <h1 className="text-xl font-extrabold leading-tight">События</h1>
          </div>
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-1.5 bg-[#FFD600] text-black text-sm font-bold rounded-full px-4 py-2 shadow-sm"
          >
            <Plus size={15} strokeWidth={2.5} />
            Добавить
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📣</div>
            <p className="text-gray-400 text-sm mb-4">Событий пока нет</p>
            <button
              onClick={() => setModal('create')}
              className="bg-[#FFD600] font-bold text-sm px-6 py-3 rounded-2xl"
            >
              Создать первое
            </button>
          </div>
        ) : (
          events.map(e => (
            <div key={e.id} className={`bg-white rounded-2xl border overflow-hidden ${e.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
              {e.imageUrl && (
                <div className="h-36 overflow-hidden">
                  <img src={e.imageUrl} alt={e.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="px-4 pt-3 pb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${e.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {e.active ? 'Активно' : 'Скрыто'}
                  </span>
                  {e.sortOrder > 0 && <span className="text-[11px] text-gray-300">#{e.sortOrder}</span>}
                </div>
                <h3 className="font-bold text-[15px] text-gray-900">{e.title}</h3>
                {e.text && <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">{e.text}</p>}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => toggleActive(e)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    {e.active ? <EyeOff size={11} /> : <Eye size={11} />}
                    {e.active ? 'Скрыть' : 'Показать'}
                  </button>
                  <button
                    onClick={() => setModal(e)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <Pencil size={11} /> Изменить
                  </button>
                  <button
                    onClick={() => deleteEvent(e.id)}
                    className="ml-auto w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modal && (
        <EventModal
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}

      <AdminNav />
    </div>
  )
}

function EventModal({ initial, onClose, onSaved }: {
  initial: AppEvent | null
  onClose: () => void
  onSaved: (e: AppEvent, isNew: boolean) => void
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [text, setText] = useState(initial?.text || '')
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.imageUrl || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function pickImage(files: FileList | null) {
    if (!files?.[0]) return
    setImageFile(files[0])
    const r = new FileReader()
    r.onload = e => setImagePreview(e.target?.result as string)
    r.readAsDataURL(files[0])
  }

  async function save() {
    if (!title.trim()) { setError('Введите заголовок'); return }
    setSaving(true)
    setError('')
    try {
      const form = new FormData()
      form.append('title', title.trim())
      form.append('text', text.trim())
      form.append('sortOrder', sortOrder)
      if (imageFile) form.append('image', imageFile)
      else if (initial?.imageUrl) form.append('imageUrl', initial.imageUrl)

      const r = initial
        ? await api.put(`/admin/events/${initial.id}`, form)
        : await api.post('/admin/events', form)

      onSaved(r.data, !initial)
    } catch {
      setError('Ошибка сохранения')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center px-4 pt-4 pb-20" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="font-extrabold text-base">{initial ? 'Редактировать' : 'Новое событие'}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Image */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Изображение</p>
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden h-40">
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-300 hover:border-gray-300 transition-colors"
              >
                <ImagePlus size={24} />
                <span className="text-xs font-medium">Добавить фото</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => pickImage(e.target.files)} />
          </div>

          {/* Title */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Заголовок *</p>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Новый квест в Macau!"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFD600] transition-colors"
            />
          </div>

          {/* Text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Текст</p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              placeholder="Подробное описание события..."
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#FFD600] transition-colors"
            />
          </div>

          {/* Sort order */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Порядок (меньше = выше)</p>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFD600] transition-colors"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-sm disabled:opacity-50"
          >
            {saving ? 'Сохраняем...' : initial ? 'Сохранить изменения' : 'Создать событие'}
          </button>
        </div>
      </div>
    </div>
  )
}
