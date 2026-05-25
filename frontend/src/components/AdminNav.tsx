import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BarChart2, Map, MessageSquare, Tag, Globe, Bell, Megaphone } from 'lucide-react'
import { useState } from 'react'
import { useAdminNotif } from '../context/AdminNotifContext'

const navItems = [
  { to: '/admin',          Icon: BarChart2,   label: 'Стат.'   },
  { to: '/admin/quests',   Icon: Map,         label: 'Квесты'  },
  { to: '/admin/reviews',  Icon: MessageSquare, label: 'Отзывы' },
  { to: '/admin/promo',    Icon: Tag,         label: 'Промо'   },
  { to: '/admin/cities',   Icon: Globe,       label: 'Города'  },
  { to: '/admin/events',   Icon: Megaphone,   label: 'Акции'   },
]

const ICONS: Record<string, string> = { review: '⭐', purchase: '💰', promo: '🎟️' }
const ROUTES: Record<string, string> = { review: '/admin/reviews', purchase: '/admin/sales', promo: '/admin/promo' }

export default function AdminNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { notifications, unread, markAllRead, clearAll } = useAdminNotif()
  const [open, setOpen] = useState(false)

  function togglePanel() {
    setOpen(v => !v)
    markAllRead()
  }

  return (
    <>
      {/* Notification panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-24 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 max-h-72 overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <p className="text-sm font-bold">Уведомления</p>
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] text-gray-400">Очистить</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-8">Нет уведомлений</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { setOpen(false); navigate(ROUTES[n.type] || '/admin') }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3"
                  >
                    <span className="text-base mt-0.5 flex-shrink-0">{ICONS[n.type] || '🔔'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(n.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
        <nav className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/15 flex items-center gap-1 px-2 py-2 w-full max-w-sm border border-gray-100">
          {navItems.map(({ to, Icon, label }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200 active:scale-95 ${active ? 'bg-[#FFD600]' : 'hover:bg-gray-50'}`}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'text-black' : 'text-gray-400'}
                />
                <span className={`text-[9px] font-semibold leading-none ${active ? 'text-black' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* Bell */}
          <button
            onClick={togglePanel}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200 active:scale-95 hover:bg-gray-50 relative"
          >
            <div className="relative">
              <Bell
                size={18}
                strokeWidth={1.8}
                className={open || unread > 0 ? 'text-[#b8860b]' : 'text-gray-400'}
              />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center px-0.5">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <span className={`text-[9px] font-semibold leading-none ${unread > 0 ? 'text-[#b8860b]' : 'text-gray-400'}`}>
              Увед.
            </span>
          </button>
        </nav>
      </div>
    </>
  )
}
