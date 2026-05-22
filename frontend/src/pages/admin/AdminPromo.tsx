import { useEffect, useState } from 'react'
import { ArrowLeft, Tag, Plus, X, Ticket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'

interface PromoCode {
  _id: string
  code: string
  discount: number
  type: 'percent' | 'fixed'
  usedCount: number
  maxUses: number
  active: boolean
}

export default function AdminPromo() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ code: '', discount: 10, type: 'percent' as 'percent' | 'fixed', maxUses: 100 })
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/promo').then(r => setCodes(r.data)).finally(() => setLoading(false))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const r = await api.post('/admin/promo', form)
    setCodes(c => [r.data, ...c])
    setCreating(false)
    setForm({ code: '', discount: 10, type: 'percent', maxUses: 100 })
  }

  async function toggle(id: string, active: boolean) {
    await api.patch(`/admin/promo/${id}`, { active })
    setCodes(c => c.map(x => x._id === id ? { ...x, active } : x))
  }

  const active = codes.filter(c => c.active)
  const inactive = codes.filter(c => !c.active)

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
            <p className="text-xs text-gray-400 font-medium">Маркетинг</p>
            <h1 className="text-xl font-extrabold leading-tight">Промо коды</h1>
          </div>
          <button onClick={() => setCreating(v => !v)}
            className={`flex items-center gap-1.5 text-sm font-bold rounded-full px-4 py-2 transition-colors ${
              creating ? 'bg-gray-100 text-gray-500' : 'bg-[#FFD600] text-black shadow-sm'
            }`}>
            {creating ? <X size={14} /> : <Plus size={14} strokeWidth={2.5} />}
            {creating ? 'Отмена' : 'Создать'}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-4">

        {/* Create form */}
        {creating && (
          <form onSubmit={create} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 pt-4 pb-2 border-b border-gray-50">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Новый промо код</p>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Код</label>
              <input
                placeholder="SUMMER2025"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
                className="mt-1 w-full text-sm font-mono font-bold text-gray-900 focus:outline-none bg-transparent tracking-widest"
              />
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-50">
              <div className="px-4 py-3 border-b border-gray-50">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Скидка</label>
                <input
                  type="number"
                  value={form.discount}
                  onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))}
                  required
                  className="mt-1 w-full text-sm font-bold text-gray-800 focus:outline-none bg-transparent"
                />
              </div>
              <div className="px-4 py-3 border-b border-gray-50">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Тип</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}
                  className="mt-1 w-full text-sm font-bold text-gray-800 focus:outline-none bg-transparent"
                >
                  <option value="percent">Процент (%)</option>
                  <option value="fixed">Фиксированный</option>
                </select>
              </div>
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Макс. использований</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))}
                className="mt-1 w-full text-sm font-bold text-gray-800 focus:outline-none bg-transparent"
              />
            </div>
            <div className="px-4 py-4">
              <button type="submit"
                className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-3 text-sm flex items-center justify-center gap-2">
                <Ticket size={15} /> Создать промо код
              </button>
            </div>
          </form>
        )}

        {/* Stats row */}
        {!loading && codes.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-2xl border border-gray-100 px-3 py-3 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{codes.length}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Всего</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 px-3 py-3 text-center">
              <p className="text-2xl font-extrabold text-emerald-600">{active.length}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Активных</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 px-3 py-3 text-center">
              <p className="text-2xl font-extrabold text-gray-900">
                {codes.reduce((s, c) => s + c.usedCount, 0)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Применений</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🎟️</div>
            <p className="text-gray-400 text-sm mb-4">Промо кодов пока нет</p>
            <button onClick={() => setCreating(true)}
              className="bg-[#FFD600] font-bold text-sm px-6 py-3 rounded-2xl inline-flex items-center gap-2">
              <Plus size={14} /> Создать первый
            </button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">
                  Активные · {active.length}
                </p>
                {active.map(c => <PromoCard key={c._id} c={c} onToggle={toggle} />)}
              </div>
            )}
            {inactive.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">
                  Отключены · {inactive.length}
                </p>
                {inactive.map(c => <PromoCard key={c._id} c={c} onToggle={toggle} />)}
              </div>
            )}
          </>
        )}
      </div>

      <AdminNav />
    </div>
  )
}

function PromoCard({ c, onToggle }: { c: PromoCode; onToggle: (id: string, active: boolean) => void }) {
  const usedPct = c.maxUses > 0 ? Math.round((c.usedCount / c.maxUses) * 100) : 0

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-opacity ${
      c.active ? 'border-gray-100' : 'border-gray-100 opacity-60'
    }`}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Code + discount badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF9E0] flex items-center justify-center flex-shrink-0">
              <Tag size={16} className="text-[#B8960C]" />
            </div>
            <div>
              <p className="font-extrabold text-base font-mono tracking-widest text-gray-900 leading-tight">{c.code}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {c.discount}{c.type === 'percent' ? '%' : ' HK$'} скидка
              </p>
            </div>
          </div>

          {/* Toggle */}
          <button onClick={() => onToggle(c._id, !c.active)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
              c.active ? 'bg-emerald-400' : 'bg-gray-200'
            }`}>
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
              c.active ? 'left-8' : 'left-1'
            }`} />
          </button>
        </div>

        {/* Usage bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-gray-400">Использований</span>
            <span className="text-[11px] font-bold text-gray-700">{c.usedCount} / {c.maxUses}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usedPct >= 90 ? 'bg-red-400' : usedPct >= 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
