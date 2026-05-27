import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, X, Globe, Pencil, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'

interface City {
  _id: string
  code: string
  name: string
  flag: string
  active: boolean
  sortOrder: number
  country: string | null
  countryCode: string | null
  coverImage: string | null
  questCount: number
}

interface EditState {
  name: string
  flag: string
  country: string
  coverImage: string
}

export default function AdminCities() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', flag: '', country: '', coverImage: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', flag: '', country: '', coverImage: '' })
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/cities').then(r => setCities(r.data)).catch(() => setCities([])).finally(() => setLoading(false))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const r = await api.post('/admin/cities', {
      ...form, active: false, sortOrder: cities.length,
      countryCode: form.country.toLowerCase().replace(/\s+/g, '-'),
    })
    setCities(c => [...c, r.data])
    setCreating(false)
    setForm({ code: '', name: '', flag: '', country: '', coverImage: '' })
  }

  function startEdit(city: City) {
    setEditId(city._id)
    setEditState({
      name: city.name,
      flag: city.flag || '',
      country: city.country || '',
      coverImage: city.coverImage || '',
    })
  }

  async function saveEdit() {
    if (!editId) return
    await api.patch(`/admin/cities/${editId}`, {
      name: editState.name,
      flag: editState.flag,
      country: editState.country,
      countryCode: editState.country.toLowerCase().replace(/\s+/g, '-'),
      coverImage: editState.coverImage || null,
    })
    setCities(cs => cs.map(c => c._id === editId ? {
      ...c,
      name: editState.name,
      flag: editState.flag,
      country: editState.country,
      coverImage: editState.coverImage || null,
    } : c))
    setEditId(null)
  }

  async function toggle(id: string, active: boolean) {
    await api.patch(`/admin/cities/${id}`, { active })
    setCities(c => c.map(x => x._id === id ? { ...x, active } : x))
  }

  async function remove(id: string) {
    if (!confirm('Удалить город?')) return
    await api.delete(`/admin/cities/${id}`)
    setCities(c => c.filter(x => x._id !== id))
  }

  const Field = ({ label, value, onChange, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string
  }) => (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="mt-0.5 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD600] bg-white" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate('/admin')}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowLeft size={16} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-medium">Настройки</p>
            <h1 className="text-xl font-extrabold leading-tight">Города</h1>
          </div>
          <button onClick={() => setCreating(v => !v)}
            className={`flex items-center gap-1.5 text-sm font-bold rounded-full px-4 py-2 transition-colors ${
              creating ? 'bg-gray-100 text-gray-500' : 'bg-[#FFD600] text-black shadow-sm'
            }`}>
            {creating ? <X size={14} /> : <Plus size={14} strokeWidth={2.5} />}
            {creating ? 'Отмена' : 'Добавить'}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">

        {/* Hint */}
        <div className="bg-blue-50 rounded-2xl px-4 py-3 text-xs text-blue-600 leading-relaxed">
          <b>Регион / Континент</b> — это заголовок группы на странице городов.<br />
          Примеры: <span className="font-mono">Азия</span>, <span className="font-mono">Центральная Азия</span>, <span className="font-mono">Европа</span>, <span className="font-mono">СНГ</span>
        </div>

        {/* Create form */}
        {creating && (
          <form onSubmit={create} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Новый город</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Код (hk, tashkent...)" value={form.code}
                onChange={v => setForm(f => ({ ...f, code: v.toLowerCase() }))} placeholder="tashkent" />
              <Field label="Флаг (эмодзи)" value={form.flag}
                onChange={v => setForm(f => ({ ...f, flag: v }))} placeholder="🇺🇿" />
            </div>
            <Field label="Название" value={form.name}
              onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Tashkent" />
            <Field label="Регион / Континент" value={form.country}
              onChange={v => setForm(f => ({ ...f, country: v }))} placeholder="Центральная Азия" />
            <Field label="Фото города (URL)" value={form.coverImage}
              onChange={v => setForm(f => ({ ...f, coverImage: v }))} placeholder="https://images.unsplash.com/..." />
            <button type="submit"
              className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-3 text-sm flex items-center justify-center gap-2">
              <Globe size={15} /> Добавить город
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cities.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🌍</div>
            <p className="text-gray-400 text-sm mb-4">Городов пока нет</p>
            <button onClick={() => setCreating(true)}
              className="bg-[#FFD600] font-bold text-sm px-6 py-3 rounded-2xl inline-flex items-center gap-2">
              <Plus size={14} /> Добавить первый
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {cities.map(city => (
              <div key={city._id}
                className={`bg-white rounded-2xl border overflow-hidden ${city.active ? 'border-gray-100' : 'border-gray-100 opacity-70'}`}>

                {/* Main row */}
                <div className="px-4 py-3.5 flex items-center gap-3">
                  {city.coverImage
                    ? <img src={city.coverImage} alt={city.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">{city.flag || '🏙️'}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-base text-gray-900">{city.name}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{city.code}</p>
                    <p className="text-xs font-semibold text-purple-500 mt-0.5">{city.country || '— регион не задан'}</p>
                    {city.questCount > 0 && <p className="text-xs text-teal-500 font-semibold">{city.questCount} квест(а)</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => editId === city._id ? setEditId(null) : startEdit(city)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        editId === city._id ? 'bg-yellow-100' : 'bg-gray-100 hover:bg-gray-200'
                      }`}>
                      <Pencil size={13} className={editId === city._id ? 'text-yellow-600' : 'text-gray-500'} />
                    </button>
                    <button onClick={() => toggle(city._id, !city.active)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${city.active ? 'bg-emerald-400' : 'bg-gray-200'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${city.active ? 'left-7' : 'left-1'}`} />
                    </button>
                    <button onClick={() => remove(city._id)}
                      className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                      <X size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Inline edit panel */}
                {editId === city._id && (
                  <div className="px-4 pb-4 pt-1 bg-yellow-50/50 border-t border-gray-100 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Название" value={editState.name}
                        onChange={v => setEditState(s => ({ ...s, name: v }))} />
                      <Field label="Флаг (эмодзи)" value={editState.flag}
                        onChange={v => setEditState(s => ({ ...s, flag: v }))} placeholder="🇺🇿" />
                    </div>
                    <Field label="Регион / Континент" value={editState.country}
                      onChange={v => setEditState(s => ({ ...s, country: v }))}
                      placeholder="Центральная Азия" />
                    <Field label="Фото города (URL)" value={editState.coverImage}
                      onChange={v => setEditState(s => ({ ...s, coverImage: v }))}
                      placeholder="https://images.unsplash.com/..." />
                    {editState.coverImage && (
                      <img src={editState.coverImage} alt="preview"
                        className="w-full h-28 object-cover rounded-xl" onError={e => (e.target as HTMLImageElement).style.display='none'} />
                    )}
                    <div className="flex gap-2">
                      <button onClick={saveEdit}
                        className="flex items-center gap-1.5 bg-[#FFD600] text-black font-bold rounded-xl px-5 py-2 text-xs">
                        <Check size={13} /> Сохранить
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 font-bold rounded-xl px-4 py-2 text-xs">
                        <X size={13} /> Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminNav />
    </div>
  )
}
