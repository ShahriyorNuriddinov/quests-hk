import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, Wallet, TrendingUp, Plus } from 'lucide-react'
import api from '../../api/client'
import PartnerNav from '../../components/PartnerNav'
import { useAuth } from '../../context/AuthContext'

interface Stats {
  quests: number
  totalEarned: number
  totalSales: number
  payoutPercent: number
  businessName: string | null
}

export default function PartnerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.get('/partner/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Партнёрская панель</p>
            <h1 className="text-xl font-extrabold leading-tight">
              {stats?.businessName || user?.displayName || user?.email?.split('@')[0]}
            </h1>
          </div>
          <button
            onClick={() => navigate('/partner/quests/new')}
            className="flex items-center gap-1.5 bg-[#FFD600] rounded-full px-4 py-2 text-xs font-bold shadow-sm"
          >
            <Plus size={12} />
            Новый квест
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">

        {/* Revenue hero */}
        <div className="bg-[#FFD600] rounded-2xl px-5 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-black/60">Мой заработок</p>
              <p className="text-4xl font-extrabold text-black mt-1 tracking-tight">
                {stats ? `${stats.totalEarned.toFixed(0)} HK$` : '—'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-black/10 flex items-center justify-center">
              <TrendingUp size={22} className="text-black" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between">
            <span className="text-xs font-semibold text-black/50">Моя доля: {stats?.payoutPercent ?? 70}%</span>
            <span className="text-xs font-bold text-black bg-black/10 rounded-full px-2.5 py-1">
              {stats?.totalSales ?? 0} продаж
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => navigate('/partner/quests')}
            className="bg-blue-50 rounded-2xl px-4 py-4 cursor-pointer active:scale-[0.97] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm">
              <Map size={18} className="text-blue-500" />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Квесты</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats?.quests ?? '—'}</p>
            <p className="text-xs font-semibold mt-1 text-blue-500">Управлять →</p>
          </div>

          <div
            onClick={() => navigate('/partner/earnings')}
            className="bg-green-50 rounded-2xl px-4 py-4 cursor-pointer active:scale-[0.97] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm">
              <Wallet size={18} className="text-green-500" />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Продажи</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats?.totalSales ?? '—'}</p>
            <p className="text-xs font-semibold mt-1 text-green-500">История →</p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-sm font-bold text-gray-800 mb-2">Как это работает</p>
          <div className="flex flex-col gap-2 text-xs text-gray-500 leading-relaxed">
            <p>📝 Создайте квест — он появится у вас со статусом <b>На проверке</b></p>
            <p>✅ Администратор проверяет и публикует квест</p>
            <p>💰 С каждой продажи вам начисляется <b>{stats?.payoutPercent ?? 70}%</b> от цены</p>
            <p>💳 Выплаты — по запросу через администратора</p>
          </div>
        </div>

      </div>

      <PartnerNav />
    </div>
  )
}
