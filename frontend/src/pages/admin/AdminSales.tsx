import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'

interface Sale {
  userId: string
  questId: string
  email: string
  questTitle: string
  price: number
  currency: string
  purchasedAt?: string
}

interface ChartData {
  byDay: { day: string; sales: number; revenue: number }[]
  byQuest: { title: string; sales: number; revenue: number }[]
}

function fmt(day: string) {
  const d = new Date(day)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function shortTitle(t: string) {
  return t.length > 12 ? t.slice(0, 11) + '…' : t
}

export default function AdminSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [chart, setChart] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const total = sales.reduce((sum, s) => sum + s.price, 0)

  useEffect(() => {
    api.get('/admin/sales').then(r => setSales(r.data)).finally(() => setLoading(false))
    api.get('/admin/sales/chart').then(r => setChart(r.data)).catch(() => {})
  }, [])

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
            <p className="text-xs text-gray-400 font-medium">Аналитика</p>
            <h1 className="text-xl font-extrabold leading-tight">Продажи</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Итого</p>
            <p className="text-base font-extrabold text-green-600">{total} HK$</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">

          {/* Revenue hero */}
          <div className="bg-[#FFD600] rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-black/60">Выручка за 30 дней</p>
              <div className="w-8 h-8 bg-black/10 rounded-xl flex items-center justify-center">
                <TrendingUp size={16} className="text-black" />
              </div>
            </div>
            {chart && chart.byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chart.byDay} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tickFormatter={fmt} tick={{ fontSize: 9, fill: 'rgba(0,0,0,0.4)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'rgba(0,0,0,0.4)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`${v} HK$`, 'Выручка']}
                    labelFormatter={(l) => fmt(String(l))}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="rgba(0,0,0,0.4)" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-black/30 text-sm py-6">Нет данных</p>
            )}
          </div>

          {/* By quest */}
          {chart && chart.byQuest.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">По квестам</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chart.byQuest.map(q => ({ ...q, title: shortTitle(q.title) }))}
                  margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="title" tick={{ fontSize: 9, fill: '#bbb' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#bbb' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v, name) => [name === 'revenue' ? `${v} HK$` : v, name === 'revenue' ? 'Выручка' : 'Продаж']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="#FFD600" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-50">
                {chart.byQuest.map(q => (
                  <div key={q.title} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FFD600] flex-shrink-0" />
                    <span className="text-xs text-gray-600 truncate flex-1">{q.title}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{q.sales} чел.</span>
                    <span className="text-xs font-bold text-gray-800 flex-shrink-0">{q.revenue} HK$</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-4 pt-4 pb-3">
              Транзакции · {sales.length}
            </p>
            {sales.length === 0 ? (
              <p className="text-center text-gray-300 text-sm py-8 pb-6">Нет продаж</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {sales.map((s, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">💳</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.questTitle}</p>
                      <p className="text-xs text-gray-400 truncate">{s.email}</p>
                      {s.purchasedAt && (
                        <p className="text-[11px] text-gray-300">
                          {new Date(s.purchasedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-extrabold text-green-600 flex-shrink-0">
                      +{s.price} {s.currency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      <AdminNav />
    </div>
  )
}
