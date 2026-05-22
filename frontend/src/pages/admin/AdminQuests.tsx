import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'

interface Quest {
  _id: string
  title: string
  description: string
  rating: number
  price: number
  currency: string
  completedCount: number
  status: 'published' | 'draft'
}

export default function AdminQuests() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/quests').then(r => setQuests(r.data)).finally(() => setLoading(false))
  }, [])

  async function deleteQuest(id: string) {
    if (!confirm('Удалить квест?')) return
    await api.delete(`/admin/quests/${id}`)
    setQuests(q => q.filter(x => x._id !== id))
  }

  const published = quests.filter(q => q.status === 'published')
  const drafts = quests.filter(q => q.status === 'draft')

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-gray-400 font-medium">Контент</p>
            <h1 className="text-xl font-extrabold leading-tight">Все квесты</h1>
          </div>
          <Link to="/admin/quests/new"
            className="flex items-center gap-1.5 bg-[#FFD600] text-black text-sm font-bold rounded-full px-4 py-2 shadow-sm">
            <Plus size={15} strokeWidth={2.5} />
            Добавить
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : quests.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-gray-400 text-sm mb-4">Квестов пока нет</p>
            <Link to="/admin/quests/new" className="bg-[#FFD600] font-bold text-sm px-6 py-3 rounded-2xl inline-block">
              Создать первый
            </Link>
          </div>
        ) : (
          <>
            {published.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">
                  Опубликованы · {published.length}
                </p>
                {published.map(q => <QuestCard key={q._id} q={q} onDelete={deleteQuest} />)}
              </div>
            )}
            {drafts.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">
                  Черновики · {drafts.length}
                </p>
                {drafts.map(q => <QuestCard key={q._id} q={q} onDelete={deleteQuest} />)}
              </div>
            )}
          </>
        )}
      </div>

      <AdminNav />
    </div>
  )
}

function QuestCard({ q, onDelete }: { q: Quest; onDelete: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            q.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {q.status === 'published' ? 'Опубликован' : 'Черновик'}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <Star size={11} fill="#FFD600" strokeWidth={0} />
            <span className="text-xs font-semibold text-gray-600">{q.rating.toFixed(1)}</span>
          </div>
          {q.completedCount > 0 && (
            <span className="text-xs text-gray-400">{q.completedCount} прошли</span>
          )}
        </div>

        <h3 className="font-bold text-[15px] leading-snug text-gray-900">{q.title}</h3>
        <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">{q.description}</p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-sm font-extrabold text-gray-900">{q.price} {q.currency}</span>
          <div className="flex items-center gap-3">
            <Link to={`/admin/quests/${q._id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl hover:bg-gray-200 transition-colors">
              <Pencil size={11} /> Редактировать
            </Link>
            <button onClick={() => onDelete(q._id)}
              className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
              <Trash2 size={13} className="text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
