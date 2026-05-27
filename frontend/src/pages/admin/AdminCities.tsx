import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, X, Globe } from 'lucide-react'
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

export default function AdminCities() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', flag: '', country: '', coverImage: '' })
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/cities').then(r => setCities(r.data)).catch(() => setCities([])).finally(() => setLoading(false))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const r = await api.post('/admin/cities', { ...form, active: false, sortOrder: cities.length, countryCode: form.country.toLowerCase().replace(/\s+/g, '-') })
    setCities(c => [...c, r.data])
    setCreating(false)
    setForm({ code: '', name: '', flag: '', country: '', coverImage: '' })
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

        {/* Create form */}
        {creating && (
          <form onSubmit={create} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 pt-4 pb-2 border-b border-gray-50">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Новый город</p>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Код (напр. hk, macau)</label>
              <input
                placeholder="hk"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toLowerCase() }))}
                required
                className="mt-1 w-full text-sm font-mono font-bold text-gray-900 focus:outline-none bg-transparent"
              />
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Название</label>
              <input
                placeholder="Hong Kong"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="mt-1 w-full text-sm font-bold text-gray-800 focus:outline-none bg-transparent"
              />
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Флаг (эмодзи)</label>
              <input
                placeholder="🇭🇰"
                value={form.flag}
                onChange={e => setForm(f => ({ ...f, flag: e.target.value }))}
                className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent"
              />
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Страна / Регион</label>
              <input
                placeholder="Китай / Азия"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent"
              />
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Фото города (URL)</label>
              <input
                placeholder="https://images.unsplash.com/..."
                value={form.coverImage}
                onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                className="mt-1 w-full text-sm text-gray-800 focus:outline-none bg-transparent"
              />
            </div>
            <div className="px-4 py-4">
              <button type="submit"
                className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-3 text-sm flex items-center justify-center gap-2">
                <Globe size={15} /> Добавить город
              </button>
            </div>
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
                className={`bg-white rounded-2xl border overflow-hidden transition-opacity ${
                  city.active ? 'border-gray-100' : 'border-gray-100 opacity-60'
                }`}>
                <div className="px-4 py-4 flex items-center gap-3">
                  {city.coverImage
                    ? <img src={city.coverImage} alt={city.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    : <span className="text-2xl">{city.flag || '🏙️'}</span>
                  }
                  <div className="flex-1">
                    <p className="font-extrabold text-base text-gray-900">{city.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{city.code} · {city.country || '—'}</p>
                    {city.questCount > 0 && <p className="text-xs text-teal-500 font-semibold">{city.questCount} квест(а)</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Toggle */}
                    <button onClick={() => toggle(city._id, !city.active)}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        city.active ? 'bg-emerald-400' : 'bg-gray-200'
                      }`}>
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                        city.active ? 'left-8' : 'left-1'
                      }`} />
                    </button>
                    {/* Delete */}
                    <button onClick={() => remove(city._id)}
                      className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                      <X size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    city.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {city.active ? 'Активен' : 'Выключен (coming soon)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminNav />
    </div>
  )
}
