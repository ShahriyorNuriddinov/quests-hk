import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, X, TrendingUp, Users, MessageSquare, Tag, Map, ShoppingBag } from 'lucide-react'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'

interface Stats {
  sales: number
  promoCodes: number
  payouts: number
  users: number
  completedQuests: number
  reviews: number
}

function NotifyModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<number | null>(null)

  async function send() {
    if (!subject.trim() || !message.trim()) return
    setSending(true)
    try {
      const r = await api.post('/admin/notify', { subject, message })
      setResult(r.data.sent)
    } catch {
      setResult(0)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold">Рассылка пользователям</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        {result !== null ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-bold text-gray-900">Отправлено: {result} писем</p>
            <button onClick={onClose} className="mt-5 w-full bg-[#FFD600] font-bold rounded-2xl py-3 text-sm">Закрыть</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Тема письма</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Новый квест уже доступен!"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FFD600]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Сообщение</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                rows={4} placeholder="Текст письма..."
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#FFD600]" />
            </div>
            <button onClick={send} disabled={sending || !subject.trim() || !message.trim()}
              className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40">
              <Send size={15} />
              {sending ? 'Отправляем...' : 'Отправить всем'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminStats() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [showNotify, setShowNotify] = useState(false)

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data))
  }, [])

  const cards = [
    { icon: ShoppingBag,   label: 'Продажи',          value: stats?.sales,           accent: 'bg-blue-50',   iconColor: 'text-blue-500',   href: '/admin/sales',   sub: 'Подробнее' },
    { icon: Users,         label: 'Участники',        value: stats?.users,           accent: 'bg-purple-50', iconColor: 'text-purple-500', href: '/admin/users',   sub: 'Список' },
    { icon: Map,           label: 'Пройдено квестов', value: stats?.completedQuests, accent: 'bg-green-50',  iconColor: 'text-green-500',  href: null,             sub: null },
    { icon: MessageSquare, label: 'Отзывы',           value: stats?.reviews,         accent: 'bg-orange-50', iconColor: 'text-orange-500', href: '/admin/reviews', sub: 'Просмотреть' },
    { icon: Tag,           label: 'Промо коды',       value: stats?.promoCodes,      accent: 'bg-pink-50',   iconColor: 'text-pink-500',   href: '/admin/promo',   sub: 'Управлять' },
    { icon: Map,           label: 'Квесты',           value: null,                   accent: 'bg-amber-50',  iconColor: 'text-amber-500',  href: '/admin/quests',  sub: 'Управлять' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-gray-400 font-medium">Панель управления</p>
            <h1 className="text-xl font-extrabold leading-tight">Статистика</h1>
          </div>
          <button onClick={() => setShowNotify(true)}
            className="flex items-center gap-1.5 bg-[#FFD600] rounded-full px-4 py-2 text-xs font-bold shadow-sm">
            <Send size={12} />
            Рассылка
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">

        {/* Revenue hero card */}
        <div
          onClick={() => navigate('/admin/sales')}
          className="bg-[#FFD600] rounded-2xl px-5 py-5 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-black/60">Общая выручка</p>
              <p className="text-4xl font-extrabold text-black mt-1 tracking-tight">
                {stats ? `${stats.payouts} HK$` : '—'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-black/10 flex items-center justify-center">
              <TrendingUp size={22} className="text-black" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between">
            <span className="text-xs font-semibold text-black/50">Все транзакции →</span>
            <span className="text-xs font-bold text-black bg-black/10 rounded-full px-2.5 py-1">
              {stats?.sales ?? 0} продаж
            </span>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map(({ icon: Icon, label, value, accent, iconColor, href, sub }) => (
            <div
              key={label}
              onClick={() => href && navigate(href)}
              className={`${accent} rounded-2xl px-4 py-4 ${href ? 'cursor-pointer active:scale-[0.97] transition-transform' : ''}`}
            >
              <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm`}>
                <Icon size={18} className={iconColor} />
              </div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
              <p className="text-2xl font-extrabold text-gray-900">{value ?? '—'}</p>
              {sub && (
                <p className={`text-xs font-semibold mt-1 ${iconColor}`}>{sub} →</p>
              )}
            </div>
          ))}

        </div>

      </div>

      {showNotify && <NotifyModal onClose={() => setShowNotify(false)} />}
      <AdminNav />
    </div>
  )
}
