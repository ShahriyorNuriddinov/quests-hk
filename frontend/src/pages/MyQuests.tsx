import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, RotateCcw, Star, LogOut } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

interface Quest {
  _id: string
  title: string
  description: string
  coverImage?: string
  progress: { current: number; total: number } | null
  completed: boolean
}

export default function MyQuests() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/my-quests').then(r => setQuests(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-extrabold">Мои квесты</h1>
        <button
          onClick={() => { logout(); navigate('/') }}
          className="flex items-center gap-1.5 text-sm text-gray-400"
        >
          <LogOut size={15} />
          Выйти
        </button>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : quests.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-gray-400 mb-6 text-sm">У вас пока нет квестов</p>
            <Link to="/quests" className="bg-[#FFD600] font-bold text-sm px-6 py-3 rounded-2xl inline-block">
              Выбрать квест
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {quests.map(q => {
              const pct = q.progress ? Math.round((q.progress.current / q.progress.total) * 100) : 0
              return (
                <Link
                  key={q._id}
                  to={q.completed ? `/quest/${q._id}/review` : `/quest/${q._id}/play`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col active:scale-[0.99] transition-transform"
                >
                  {/* Cover */}
                  <div className="h-44 bg-gradient-to-br from-yellow-200 to-yellow-400 overflow-hidden flex-shrink-0 relative">
                    {q.coverImage && (
                      <img src={q.coverImage} alt={q.title} className="w-full h-full object-cover" />
                    )}
                    {/* Status badge */}
                    {q.completed ? (
                      <span className="absolute top-3 right-3 bg-green-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        ✓ Завершён
                      </span>
                    ) : q.progress ? (
                      <span className="absolute top-3 right-3 bg-black/50 text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                        {q.progress.current}/{q.progress.total}
                      </span>
                    ) : null}
                  </div>

                  <div className="px-4 pt-3 pb-4">
                    <h2 className="font-bold text-[15px] leading-snug text-gray-900">{q.title}</h2>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">{q.description}</p>

                    <div className="mt-3">
                      {q.completed ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px]">✓</span>
                            <span className="text-sm font-semibold text-green-600">Завершён</span>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                            <Star size={12} fill="#FFD600" strokeWidth={0} />
                            Оставить отзыв
                          </span>
                        </div>
                      ) : q.progress ? (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                              <Play size={11} fill="currentColor" strokeWidth={0} />
                              Продолжить
                            </span>
                            <span className="text-xs text-gray-400">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-[#FFD600] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <RotateCcw size={13} className="text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500">Не начат</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
