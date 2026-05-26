import { useEffect, useState } from 'react'
import api from '../../api/client'
import PartnerNav from '../../components/PartnerNav'

interface Earning {
  id: string; amount: string; total_price: string; paid_out: boolean
  created_at: string; quest_title: string | null; buyer_email: string | null
}

export default function PartnerEarnings() {
  const [list, setList] = useState<Earning[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/partner/earnings').then(r => setList(r.data)).finally(() => setLoading(false))
  }, [])

  const unpaidTotal = list.filter(e => !e.paid_out).reduce((s, e) => s + parseFloat(e.amount), 0)
  const paidTotal   = list.filter(e =>  e.paid_out).reduce((s, e) => s + parseFloat(e.amount), 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-extrabold max-w-lg mx-auto">Заработок</h1>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FFD600] rounded-2xl px-4 py-4">
            <p className="text-xs font-semibold text-black/60 mb-1">К выплате</p>
            <p className="text-2xl font-extrabold text-black">{unpaidTotal.toFixed(0)} HK$</p>
          </div>
          <div className="bg-white rounded-2xl px-4 py-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 mb-1">Выплачено</p>
            <p className="text-2xl font-extrabold text-gray-900">{paidTotal.toFixed(0)} HK$</p>
          </div>
        </div>

        {unpaidTotal > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
            Для получения выплаты свяжитесь с администратором.
          </div>
        )}

        {loading && <div className="text-center py-10"><div className="w-7 h-7 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin mx-auto" /></div>}

        {!loading && list.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-gray-400 text-sm">Продаж пока нет</p>
          </div>
        )}

        {list.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            {list.map((e, i) => (
              <div key={e.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < list.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.paid_out ? 'bg-gray-300' : 'bg-green-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{e.quest_title || 'Квест'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(e.created_at).toLocaleDateString('ru-RU')}
                    {e.paid_out ? ' · Выплачено' : ' · Ожидает выплаты'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">+{parseFloat(e.amount).toFixed(0)} HK$</p>
                  <p className="text-[10px] text-gray-400">из {parseFloat(e.total_price).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PartnerNav />
    </div>
  )
}
