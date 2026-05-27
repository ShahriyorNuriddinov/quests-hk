import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'

interface Achievement {
  code: string
  title: string
  emoji: string
  description: string
  conditionType: string
  conditionValue: number | null
  active: boolean
  sortOrder: number
}

const CONDITION_LABELS: Record<string, string> = {
  completed_gte: 'Завершил квестов ≥',
  purchased_gte: 'Купил квестов ≥',
  has_photo: 'Загрузил фото',
  has_review: 'Оставил отзыв',
}

const EMPTY_FORM = {
  code: '', title: '', emoji: '🏆', description: '',
  conditionType: 'completed_gte', conditionValue: 1, sortOrder: 0,
}

export default function AdminAchievements() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [editCode, setEditCode] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try { const r = await api.get('/admin/achievements'); setItems(r.data) } catch {}
    setLoading(false)
  }

  async function toggleActive(a: Achievement) {
    try {
      const r = await api.patch(`/admin/achievements/${a.code}`, { active: !a.active })
      setItems(prev => prev.map(x => x.code === a.code ? r.data : x))
    } catch { alert('Ошибка') }
  }

  function startEdit(a: Achievement) {
    setEditCode(a.code)
    setEditForm({
      code: a.code, title: a.title, emoji: a.emoji, description: a.description,
      conditionType: a.conditionType, conditionValue: a.conditionValue ?? 1, sortOrder: a.sortOrder,
    })
  }

  async function saveEdit() {
    if (!editCode) return
    setSaving(true)
    try {
      const r = await api.patch(`/admin/achievements/${editCode}`, {
        title: editForm.title, emoji: editForm.emoji, description: editForm.description,
        conditionType: editForm.conditionType,
        conditionValue: needsValue(editForm.conditionType) ? Number(editForm.conditionValue) : null,
        sortOrder: Number(editForm.sortOrder),
      })
      setItems(prev => prev.map(x => x.code === editCode ? r.data : x))
      setEditCode(null)
    } catch { alert('Ошибка сохранения') }
    setSaving(false)
  }

  async function addAchievement() {
    if (!addForm.code.trim() || !addForm.title.trim()) return
    setSaving(true)
    try {
      const r = await api.post('/admin/achievements', {
        ...addForm,
        conditionValue: needsValue(addForm.conditionType) ? Number(addForm.conditionValue) : null,
        sortOrder: Number(addForm.sortOrder),
      })
      setItems(prev => [...prev, r.data])
      setAddForm(EMPTY_FORM)
      setShowAdd(false)
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Ошибка')
    }
    setSaving(false)
  }

  async function remove(code: string) {
    if (!confirm(`Удалить достижение «${code}»? Оно пропадёт у всех пользователей!`)) return
    try {
      await api.delete(`/admin/achievements/${code}`)
      setItems(prev => prev.filter(x => x.code !== code))
    } catch { alert('Ошибка') }
  }

  function needsValue(type: string) {
    return type === 'completed_gte' || type === 'purchased_gte'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
              ←
            </button>
            <div>
              <p className="text-xs text-gray-400 font-medium">Геймификация</p>
              <h1 className="text-xl font-extrabold leading-tight">Достижения</h1>
            </div>
          </div>
          <button onClick={() => { setShowAdd(v => !v); setAddForm(EMPTY_FORM) }}
            className="flex items-center gap-1.5 bg-[#FFD600] rounded-full px-4 py-2 text-xs font-bold shadow-sm">
            <Plus size={12} /> Добавить
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Новое достижение</p>
            <AchievementForm form={addForm} onChange={setAddForm} />
            <div className="flex gap-2 mt-3">
              <button onClick={addAchievement} disabled={saving}
                className="flex items-center gap-1.5 bg-[#FFD600] text-black font-bold rounded-xl px-5 py-2 text-xs disabled:opacity-50">
                <Check size={13} /> Создать
              </button>
              <button onClick={() => setShowAdd(false)}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 font-bold rounded-xl px-4 py-2 text-xs">
                <X size={13} /> Отмена
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {items.map((a, i) => (
              <div key={a.code} className={i < items.length - 1 ? 'border-b border-gray-50' : ''}>

                {/* Row */}
                <div className={`flex items-center gap-3 px-4 py-3.5 ${!a.active ? 'opacity-50' : ''}`}>
                  <span className="text-2xl w-8 text-center flex-shrink-0">{a.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{a.title}</p>
                    <p className="text-[11px] text-gray-400 truncate">{a.description}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {CONDITION_LABELS[a.conditionType]}
                      {needsValue(a.conditionType) ? ` ${a.conditionValue}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleActive(a)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${a.active ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {a.active
                        ? <ToggleRight size={14} className="text-green-600" />
                        : <ToggleLeft size={14} className="text-gray-400" />}
                    </button>
                    <button onClick={() => editCode === a.code ? setEditCode(null) : startEdit(a)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${editCode === a.code ? 'bg-yellow-100' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      <Pencil size={12} className={editCode === a.code ? 'text-yellow-600' : 'text-gray-500'} />
                    </button>
                    <button onClick={() => remove(a.code)}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Inline edit */}
                {editCode === a.code && (
                  <div className="px-4 pb-4 pt-1 bg-yellow-50/60 border-t border-gray-100">
                    <AchievementForm form={editForm} onChange={setEditForm} hideCode />
                    <div className="flex gap-2 mt-3">
                      <button onClick={saveEdit} disabled={saving}
                        className="flex items-center gap-1.5 bg-[#FFD600] text-black font-bold rounded-xl px-5 py-2 text-xs disabled:opacity-50">
                        <Check size={13} /> Сохранить
                      </button>
                      <button onClick={() => setEditCode(null)}
                        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 font-bold rounded-xl px-4 py-2 text-xs">
                        <X size={13} /> Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-gray-400 text-sm">Нет достижений</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AdminNav />
    </div>
  )
}

function AchievementForm({ form, onChange, hideCode = false }: {
  form: typeof EMPTY_FORM
  onChange: (f: typeof EMPTY_FORM) => void
  hideCode?: boolean
}) {
  function set(key: keyof typeof EMPTY_FORM, val: string | number) {
    onChange({ ...form, [key]: val })
  }
  const needsValue = form.conditionType === 'completed_gte' || form.conditionType === 'purchased_gte'

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-[56px_1fr] gap-2">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Emoji</label>
          <input value={form.emoji} onChange={e => set('emoji', e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-xl px-2 py-2 text-center text-lg focus:outline-none focus:border-[#FFD600] bg-white" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Название *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Первооткрыватель"
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD600] bg-white" />
        </div>
      </div>
      {!hideCode && (
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Код (уникальный, без пробелов) *</label>
          <input value={form.code} onChange={e => set('code', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder="first_quest"
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#FFD600] bg-white" />
        </div>
      )}
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Описание</label>
        <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Завершил первый квест"
          className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD600] bg-white" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Условие</label>
          <select value={form.conditionType} onChange={e => set('conditionType', e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD600] bg-white">
            <option value="completed_gte">Завершил квестов ≥ N</option>
            <option value="purchased_gte">Купил квестов ≥ N</option>
            <option value="has_photo">Загрузил фото</option>
            <option value="has_review">Оставил отзыв</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {needsValue ? 'Значение N' : 'Порядок'}
          </label>
          <input
            type="number" min={0}
            value={needsValue ? form.conditionValue : form.sortOrder}
            onChange={e => set(needsValue ? 'conditionValue' : 'sortOrder', e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD600] bg-white"
          />
        </div>
      </div>
    </div>
  )
}
