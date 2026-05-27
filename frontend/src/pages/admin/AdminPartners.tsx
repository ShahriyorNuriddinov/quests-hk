import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Check, X, Trash2, DollarSign } from 'lucide-react'
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

interface EditState {
  percent: string
  business: string
  details: string
}

export default function AdminPartners() {
  const navigate = useNavigate()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ percent: '', business: '', details: '' })
  const [addEmail, setAddEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try { const r = await api.get('/admin/partners'); setPartners(r.data) } catch { }
    setLoading(false)
  }

  function startEdit(p: Partner) {
    setEditId(p.id)
    setEditState({ percent: String(p.payoutPercent), business: p.businessName || '', details: p.payoutDetails || '' })
  }

  async function saveEdit() {
    if (!editId) return
    try {
      await api.patch(`/admin/partners/${editId}`, {
        payoutPercent: Number(editState.percent),
        businessName: editState.business || null,
        payoutDetails: editState.details || null,
      })
      setPartners(ps => ps.map(p => p.id === editId ? {
        ...p,
        payoutPercent: Number(editState.percent),
        businessName: editState.business || null,
        payoutDetails: editState.details || null,
      } : p))
      setEditId(null)
    } catch { alert('Ошибка сохранения') }
  }

  async function payout(id: string, amount: number) {
    if (!confirm(`Выплатить ${amount.toFixed(0)} HK$?`)) return
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
      alert(e?.response?.data?.error || 'Пользователь не найден')
    }
    setAdding(false)
  }

  const totalUnpaid = partners.reduce((s, p) => s + p.unpaidAmount, 0)
  const totalEarned = partners.reduce((s, p) => s + p.totalEarned, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
              ←
            </button>
            <div>
              <p className="text-xs text-gray-400 font-medium">Партнёрская сеть</p>
              <h1 className="text-xl font-extrabold leading-tight">Партнёры</h1>
            </div>
          </div>
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 bg-[#FFD600] rounded-full px-4 py-2 text-xs font-bold shadow-sm">
            <Plus size={12} /> Добавить
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-4xl mx-auto flex flex-col gap-4">

        {/* Add partner bar */}
        {showAdd && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Добавить партнёра по email</p>
            <div className="flex gap-2">
              <input
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPartner()}
                placeholder="example@email.com"
                autoFocus
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FFD600]"
              />
              <button onClick={addPartner} disabled={adding}
                className="bg-[#FFD600] font-bold text-xs rounded-xl px-5 py-2.5 disabled:opacity-50 whitespace-nowrap">
                {adding ? 'Ищем...' : 'Назначить'}
              </button>
              <button onClick={() => setShowAdd(false)}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Summary cards */}
        {partners.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Партнёров</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{partners.length}</p>
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Выплачено всего</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{(totalEarned - totalUnpaid).toFixed(0)} HK$</p>
            </div>
            <div className="bg-[#FFD600] rounded-2xl px-4 py-3">
              <p className="text-[10px] text-black/60 font-semibold uppercase tracking-wider">К выплате</p>
              <p className="text-2xl font-extrabold text-black mt-0.5">{totalUnpaid.toFixed(0)} HK$</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-7 h-7 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* Empty */}
        {!loading && partners.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🤝</div>
            <p className="text-gray-400 text-sm">Партнёров пока нет</p>
            <button onClick={() => setShowAdd(true)}
              className="mt-4 bg-[#FFD600] font-bold rounded-2xl px-6 py-3 text-sm">
              Добавить первого
            </button>
          </div>
        )}

        {/* Table */}
        {partners.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

            {/* Table header */}
            <div className="grid grid-cols-[1fr_48px_90px_90px_56px_100px] gap-0 border-b border-gray-100 bg-gray-50">
              <div className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Партнёр</div>
              <div className="px-2 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">%</div>
              <div className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Заработок</div>
              <div className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">К выплате</div>
              <div className="px-2 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Продаж</div>
              <div className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Действия</div>
            </div>

            {partners.map((p, i) => (
              <div key={p.id}>
                {/* Data row */}
                <div className={`grid grid-cols-[1fr_48px_90px_90px_56px_100px] gap-0 items-center ${
                  i < partners.length - 1 || editId === p.id ? 'border-b border-gray-50' : ''
                } hover:bg-gray-50/50 transition-colors`}>

                  {/* Name */}
                  <div className="px-4 py-3 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {p.businessName || p.displayName || p.email}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{p.email}</p>
                  </div>

                  {/* Percent */}
                  <div className="px-2 py-3 text-center">
                    <span className="text-sm font-extrabold text-gray-800">{p.payoutPercent}</span>
                    <span className="text-[10px] text-gray-400">%</span>
                  </div>

                  {/* Total earned */}
                  <div className="px-3 py-3 text-right">
                    <p className="text-sm font-bold text-gray-800">{p.totalEarned.toFixed(0)}</p>
                    <p className="text-[10px] text-gray-400">HK$</p>
                  </div>

                  {/* Unpaid */}
                  <div className="px-3 py-3 text-right">
                    {p.unpaidAmount > 0 ? (
                      <>
                        <p className="text-sm font-bold text-green-600">{p.unpaidAmount.toFixed(0)}</p>
                        <p className="text-[10px] text-green-400">HK$</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-300 font-bold">—</p>
                    )}
                  </div>

                  {/* Sales */}
                  <div className="px-2 py-3 text-center">
                    <p className="text-sm font-bold text-gray-800">{p.totalSales}</p>
                  </div>

                  {/* Actions */}
                  <div className="px-3 py-3 flex items-center justify-end gap-1.5">
                    {p.unpaidAmount > 0 && (
                      <button
                        onClick={() => payout(p.id, p.unpaidAmount)}
                        title={`Выплатить ${p.unpaidAmount.toFixed(0)} HK$`}
                        className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors">
                        <DollarSign size={13} className="text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={() => editId === p.id ? setEditId(null) : startEdit(p)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        editId === p.id ? 'bg-yellow-100' : 'bg-gray-100 hover:bg-gray-200'
                      }`}>
                      <Pencil size={12} className={editId === p.id ? 'text-yellow-600' : 'text-gray-500'} />
                    </button>
                    <button
                      onClick={() => revoke(p.id, p.email)}
                      className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Inline edit panel */}
                {editId === p.id && (
                  <div className="px-4 py-4 bg-yellow-50/60 border-b border-gray-100">
                    <div className="grid grid-cols-1 gap-3 max-w-xl">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Доля %</label>
                          <input
                            type="number" min={1} max={100}
                            value={editState.percent}
                            onChange={e => setEditState(s => ({ ...s, percent: e.target.value }))}
                            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-[#FFD600] bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Название бизнеса</label>
                          <input
                            value={editState.business}
                            onChange={e => setEditState(s => ({ ...s, business: e.target.value }))}
                            placeholder="ООО Пример"
                            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD600] bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Реквизиты для выплат</label>
                        <textarea
                          value={editState.details}
                          onChange={e => setEditState(s => ({ ...s, details: e.target.value }))}
                          placeholder="FPS / PayMe / Bank account..."
                          rows={2}
                          className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#FFD600] bg-white"
                        />
                      </div>
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
