import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  if (!user) {
    navigate('/auth')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-extrabold">Profile</h1>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center text-2xl font-bold text-white">
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-base">{user.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {user.role === 'admin' ? 'Admin' : 'User'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm text-gray-500">Purchased quests</p>
            <p className="font-bold text-lg">{user.purchasedQuests.length}</p>
          </div>
          <button
            onClick={() => navigate('/my-quests')}
            className="w-full px-5 py-4 text-left text-sm font-medium text-yellow-600 hover:bg-gray-50 transition-colors"
          >
            My Quests →
          </button>
        </div>

        {user.role === 'admin' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => navigate('/admin')}
              className="w-full px-5 py-4 text-left text-sm font-medium text-purple-600 hover:bg-gray-50 transition-colors"
            >
              ⚙️ Admin Panel →
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 font-semibold py-3.5 rounded-2xl hover:bg-red-100 transition-colors"
        >
          Log Out
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
