import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, ShoppingBag, Crown } from 'lucide-react'
import api from '../../api/client'
import AdminNav from '../../components/AdminNav'

interface User {
  id: string
  email: string
  role: string
  purchasedQuests: string[]
  createdAt: string
}

function avatar(email: string) {
  return email.slice(0, 2).toUpperCase()
}

function avatarColor(email: string) {
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-purple-100 text-purple-600',
    'bg-green-100 text-green-600',
    'bg-orange-100 text-orange-600',
    'bg-pink-100 text-pink-600',
    'bg-teal-100 text-teal-600',
  ]
  let hash = 0
  for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return colors[hash % colors.length]
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [])

  const admins = users.filter(u => u.role === 'admin')
  const regular = users.filter(u => u.role !== 'admin')

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
            <p className="text-xs text-gray-400 font-medium">Управление</p>
            <h1 className="text-xl font-extrabold leading-tight">Участники</h1>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <Users size={17} className="text-purple-500" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-400 text-sm">Участников пока нет</p>
        </div>
      ) : (
        <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-4">

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-2xl px-3 py-3 border border-gray-100 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{users.length}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Всего</p>
            </div>
            <div className="bg-white rounded-2xl px-3 py-3 border border-gray-100 text-center">
              <p className="text-2xl font-extrabold text-gray-900">
                {users.filter(u => u.purchasedQuests.length > 0).length}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Покупали</p>
            </div>
            <div className="bg-white rounded-2xl px-3 py-3 border border-gray-100 text-center">
              <p className="text-2xl font-extrabold text-gray-900">
                {users.reduce((s, u) => s + u.purchasedQuests.length, 0)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Покупок</p>
            </div>
          </div>

          {/* Admins */}
          {admins.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">
                Администраторы · {admins.length}
              </p>
              {admins.map(u => <UserCard key={u.id} u={u} />)}
            </div>
          )}

          {/* Regular users */}
          {regular.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">
                Пользователи · {regular.length}
              </p>
              {regular.map(u => <UserCard key={u.id} u={u} />)}
            </div>
          )}

        </div>
      )}

      <AdminNav />
    </div>
  )
}

function UserCard({ u }: { u: User }) {
  const isAdmin = u.role === 'admin'
  const date = new Date(u.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3">
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${avatarColor(u.email)}`}>
        {avatar(u.email)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{u.email}</p>
          {isAdmin && <Crown size={12} className="text-purple-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-gray-400">{date}</span>
          {u.purchasedQuests.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <ShoppingBag size={10} />
              {u.purchasedQuests.length} квест{u.purchasedQuests.length === 1 ? '' : 'а'}
            </span>
          )}
        </div>
      </div>

      {/* Role badge */}
      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
        isAdmin ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'
      }`}>
        {isAdmin ? 'admin' : 'user'}
      </span>
    </div>
  )
}
