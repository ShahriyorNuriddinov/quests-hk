import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Check, X } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

interface Achievement {
  code: string
  title: string
  emoji: string
  desc: string
  earned: boolean
  earnedAt: string | null
}

const AVATAR_COLORS = ['#FFD600', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#F0A500', '#7EC8E3']

export default function Profile() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [editingColor, setEditingColor] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    api.get('/users/achievements').then(r => setAchievements(r.data)).catch(() => {})
  }, [user])

  function handleLogout() {
    logout()
    navigate('/')
  }

  async function saveName() {
    if (!nameInput.trim()) return
    setSavingName(true)
    try {
      const r = await api.patch('/users/profile', { displayName: nameInput.trim() })
      updateUser({ displayName: r.data.displayName })
      setEditingName(false)
    } catch {}
    setSavingName(false)
  }

  async function saveColor(color: string) {
    try {
      const r = await api.patch('/users/profile', { avatarColor: color })
      updateUser({ avatarColor: r.data.avatarColor })
    } catch {}
    setEditingColor(false)
  }

  if (!user) return null

  const displayLabel = user.displayName || user.email.split('@')[0]
  const avatarLetter = (user.displayName || user.email)[0].toUpperCase()
  const earnedCount = achievements.filter(a => a.earned).length

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-extrabold">Профиль</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4 max-w-lg mx-auto">

        {/* Avatar + name */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setEditingColor(c => !c)}
                style={{ backgroundColor: user.avatarColor }}
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-black shadow-sm active:scale-95 transition-transform"
              >
                {avatarLetter}
              </button>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center border border-white">
                <Pencil size={9} className="text-gray-500" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                    maxLength={30}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-[#FFD600] min-w-0"
                    placeholder="Ваше имя"
                  />
                  <button onClick={saveName} disabled={savingName} className="w-8 h-8 bg-[#FFD600] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingName(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <X size={14} className="text-gray-500" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base truncate">{displayLabel}</p>
                  <button
                    onClick={() => { setNameInput(user.displayName || ''); setEditingName(true) }}
                    className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0"
                  >
                    <Pencil size={10} className="text-gray-500" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1 ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </span>
            </div>
          </div>

          {/* Color picker */}
          {editingColor && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">Цвет аватара</p>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => saveColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full transition-transform active:scale-90 ${user.avatarColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Купленных квестов</p>
              <p className="font-bold text-lg">{user.purchasedQuests.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Достижений</p>
              <p className="font-bold text-lg">{earnedCount}/{achievements.length}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/my-quests')}
            className="w-full px-5 py-4 text-left text-sm font-medium text-[#B8A000] hover:bg-gray-50 transition-colors"
          >
            Мои квесты →
          </button>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <p className="text-sm font-extrabold text-gray-900">Достижения</p>
              <p className="text-xs text-gray-400 mt-0.5">{earnedCount} из {achievements.length} получено</p>
            </div>
            <div className="px-4 pb-4 grid grid-cols-3 gap-2">
              {achievements.map(a => (
                <div
                  key={a.code}
                  className={`rounded-2xl p-3 flex flex-col items-center text-center gap-1 transition-all ${
                    a.earned
                      ? 'bg-[#FFF9CC] border border-[#FFD600]/40'
                      : 'bg-gray-50 border border-gray-100 opacity-50'
                  }`}
                >
                  <span className={`text-2xl ${!a.earned ? 'grayscale' : ''}`}>{a.emoji}</span>
                  <span className="text-[11px] font-bold text-gray-800 leading-tight">{a.title}</span>
                  <span className="text-[9px] text-gray-400 leading-tight">{a.desc}</span>
                  {a.earned && (
                    <span className="text-[9px] text-[#B8A000] font-semibold">✓ Получено</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => navigate('/admin')}
              className="w-full px-5 py-4 text-left text-sm font-medium text-purple-600 hover:bg-gray-50 transition-colors"
            >
              ⚙️ Панель администратора →
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 font-semibold py-3.5 rounded-2xl hover:bg-red-100 transition-colors"
        >
          Выйти
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
