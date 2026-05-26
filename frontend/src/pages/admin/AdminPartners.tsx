import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Check, X, Plus } from 'lucide-react'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'

interface Partner {
  id: string
  email: string
  displayName: string | null
  businessName: string | null
  payoutPercent: number
  payoutDetails: string | null
  totalEarned: number
  unpaidAmount: number
  totalSales: number
  createdAt: string
}

export default function AdminPartners() {
  const navigate = useNavigate()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Record<string, { percent: string; business: string; details: string }>>({})
  const [addEmail, setAddEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const r = await api.get('/admin/partners')
      setPartners(r.data)
    } catch { }
    setLoading(false)
  }

  function startEdit(p: Partner) {
    setEditing(e => ({
      ...e,
      [p.id]: { percent: String(p.payoutPercent), business: p.businessName || '', details: p.payoutDetails || '' }
    }))
  }

  async function saveEdit(id: string) {
    const e = editing[id]
    if (!e) return
    try {
      await api.patch(`/admin/partners/${id}`, {
        payoutPercent: Number(e.percent),
        businessName: e.business || null,
        payoutDetails: e.details || null,
      })
      setPartners(ps => ps.map(p => p.id === id ? {
        ...p,
        payoutPercent: Number(e.percent),
        businessName: e.business || null,
        payoutDetails: e.details || null,
      } : p))
      setEditing(ed => { const next = { ...ed }; delete next[id]; return next })
    } catch { alert('Ошибка сохранения') }
  }

  async function payout(id: string) {
    if (!confirm('Отметить все выплаты как оплаченные?')) return
    try {
      await api.post(`/admin/partners/${id}/payout`)
      setPartners(ps => ps.map(p => p.id === id ? { ...p, unpaidAmount: 0 } : p))
    } catch { alert('Ошибка') }
  }

  async function revoke(id: string, email: string) {
    if (!confirm(`Убрать роль партнёра у ${email}?`)) return
    try {
      await api.delete(`/admin/partners/${id}`)
      setPartners(ps => ps.filter(p => p.id !== id))
    } catch { alert('Ошибка') }
  }

  async function addPartner() {
    if (!addEmail.trim()) return
    setAdding(true)
    try {
      const r = await api.post('/admin/partners', { email: addEmail.trim() })
      setPartners(ps => [r.data, ...ps])
      setAddEmail('')
      setShowAdd(false)
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Ошибка')
    }
    setAdding(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">←</button>
            <h1 className="text-xl font-extrabold">Партнёры</h1>
          </div>
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 bg-[#FFD600] rounded-full px-4 py-2 text-xs font-bold">
            <Plus size={12} /> Добавить
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">

        {showAdd && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-2">
            <input
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPartner()}
              placeholder="Email пользователя"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD600]"
            />
            <button onClick={addPartner} disabled={adding}
              className="bg-[#FFD600] font-bold text-xs rounded-xl px-4 py-2 disabled:opacity-50">
              {adding ? '...' : 'Назначить'}
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-10">
            <div className="w-7 h-7 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!loading && partners.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🤝</div>
            <p className="text-gray-400 text-sm">Партнёров пока нет</p>
          </div>
        )}

        {partners.map(p => {
          const isOpen = openId === p.id
          const ed = editing[p.id]
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                onClick={() => setOpenId(isOpen ? null : p.id)}>
                <div className="w-9 h-9 rounded-full bg-[#FFD600] flex items-center justify-center text-sm font-extrabold text-black flex-shrink-0">
                  {(p.displayName || p.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{p.businessName || p.displayName || p.email}</p>
                  <p className="text-xs text-gray-400 truncate">{p.email} · {p.payoutPercent}%</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {p.unpaidAmount > 0 && (
                    <p className="text-xs font-bold text-green-600">+{p.unpaidAmount.toFixed(0)} HK$</p>
                  )}
                  <p className="text-[10px] text-gray-400">{p.totalSales} продаж</p>
                </div>
                {isOpen ? <ChevronUp size={15} className="text-gray-300 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-300 flex-shrink-0" />}
              </div>

              {isOpen && (
                <div className="border-t border-gray-50">
                  {/* Stats */}
                  <div className="grid grid-cols-3 divide-x divide-gray-50 border-b border-gray-50">
                    <div className="px-4 py-3 text-center">
                      <p className="text-[10px] text-gray-400 mb-0.5">Всего заработал</p>
                      <p className="text-sm font-extrabold text-gray-800">{p.totalEarned.toFixed(0)} HK$</p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-[10px] text-gray-400 mb-0.5">К выплате</p>
                      <p className={`text-sm font-extrabold ${p.unpaidAmount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {p.unpaidAmount.toFixed(0)} HK$
                      </p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-[10px] text-gray-400 mb-0.5">Продаж</p>
                      <p className="text-sm font-extrabold text-gray-800">{p.totalSales}</p>
                    </div>
                  </div>

                  {/* Edit fields */}
                  {ed ? (
                    <div className="px-4 py-3 border-b border-gray-50 flex flex-col gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Доля партнёра %</label>
                        <input type="number" min={1} max={100} value={ed.percent} onChange={e => setEditing(x => ({ ...x, [p.id]: { ...ed, percent: e.target.value } }))}
                          className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD600]" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Название бизнеса</label>
                        <input value={ed.business} onChange={e => setEditing(x => ({ ...x, [p.id]: { ...ed, business: e.target.value } }))}
                          className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD600]" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Реквизиты для выплат</label>
                        <textarea value={ed.details} onChange={e => setEditing(x => ({ ...x, [p.id]: { ...ed, details: e.target.value } }))}
                          rows={2} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#FFD600]" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(p.id)}
                          className="flex-1 bg-[#FFD600] text-black font-bold rounded-xl py-2 text-xs flex items-center justify-center gap-1.5">
                          <Check size={13} /> Сохранить
                        </button>
                        <button onClick={() => setEditing(x => { const n = { ...x }; delete n[p.id]; return n })}
                          className="flex-1 border border-gray-200 text-gray-600 font-bold rounded-xl py-2 text-xs flex items-center justify-center gap-1.5">
                          <X size={13} /> Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-3 border-b border-gray-50 flex gap-2">
                      <button onClick={() => startEdit(p)}
                        className="flex-1 border border-gray-200 text-gray-700 font-bold rounded-xl py-2 text-xs">
                        Изменить условия
                      </button>
                      {p.unpaidAmount > 0 && (
                        <button onClick={() => payout(p.id)}
                          className="flex-1 bg-green-50 text-green-700 font-bold rounded-xl py-2 text-xs">
                          Выплатить {p.unpaidAmount.toFixed(0)} HK$
                        </button>
                      )}
                    </div>
                  )}

                  {/* Payout details if set */}
                  {p.payoutDetails && !ed && (
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Реквизиты</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{p.payoutDetails}</p>
                    </div>
                  )}

                  {/* Revoke */}
                  <div className="px-4 py-3">
                    <button onClick={() => revoke(p.id, p.email)}
                      className="text-xs text-red-400 font-medium hover:text-red-600 transition-colors">
                      Убрать роль партнёра
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <AdminNav />
    </div>
  )
}
