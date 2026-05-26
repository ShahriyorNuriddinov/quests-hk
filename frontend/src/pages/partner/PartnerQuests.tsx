import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '../../api/client'
import PartnerNav from '../../components/PartnerNav'

interface Quest {
  _id: string; title: string; status: string; price: number; currency: string
  city: string; completedCount: number; reviewCount: number
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  published: { label: 'Опубликован', cls: 'bg-green-100 text-green-700' },
  draft:     { label: 'Черновик',    cls: 'bg-gray-100 text-gray-500'   },
  pending:   { label: 'На проверке', cls: 'bg-yellow-100 text-yellow-700' },
}

export default function PartnerQuests() {
  const navigate = useNavigate()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/partner/quests').then(r => setQuests(r.data)).finally(() => setLoading(false))
  }, [])

  async function del(id: string, title: string) {
    if (!confirm(`Удалить «${title}»?`)) return
    try {
      await api.delete(`/partner/quests/${id}`)
      setQuests(q => q.filter(x => x._id !== id))
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Ошибка')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-extrabold">Мои квесты</h1>
          <button
            onClick={() => navigate('/partner/quests/new')}
            className="flex items-center gap-1.5 bg-[#FFD600] rounded-full px-4 py-2 text-xs font-bold"
          >
            <Plus size={12} /> Создать
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">
        {loading && <div className="text-center py-10"><div className="w-7 h-7 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin mx-auto" /></div>}

        {!loading && quests.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="text-gray-400 text-sm">Квестов пока нет</p>
            <button onClick={() => navigate('/partner/quests/new')}
              className="mt-4 bg-[#FFD600] font-bold rounded-2xl px-6 py-3 text-sm">
              Создать первый квест
            </button>
          </div>
        )}

        {quests.map(q => {
          const st = STATUS_LABEL[q.status] || STATUS_LABEL.draft
          return (
            <div key={q._id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    <span className="text-[10px] text-gray-400">{q.city.toUpperCase()}</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm leading-tight">{q.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{q.price} {q.currency} · {q.completedCount} продаж · {q.reviewCount} отзывов</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => navigate(`/partner/quests/${q._id}`)}
                    className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Pencil size={14} className="text-gray-500" />
                  </button>
                  {q.status !== 'published' && (
                    <button onClick={() => del(q._id, q.title)}
                      className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <PartnerNav />
    </div>
  )
}
