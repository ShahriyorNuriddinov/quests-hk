import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { useAuth } from './AuthContext'

export interface AdminNotif {
  id: number
  type: 'review' | 'purchase' | 'promo'
  message: string
  ts: number
  read: boolean
}

interface AdminNotifCtx {
  notifications: AdminNotif[]
  unread: number
  markAllRead: () => void
  clearAll: () => void
}

const Ctx = createContext<AdminNotifCtx>({
  notifications: [], unread: 0, markAllRead: () => {}, clearAll: () => {},
})

export function useAdminNotif() { return useContext(Ctx) }

const ICONS: Record<string, string> = { review: '⭐', purchase: '💰', promo: '🎟️' }
const ROUTES: Record<string, string> = { review: '/admin/reviews', purchase: '/admin/sales', promo: '/admin/promo' }

function NotifToast({ notif, onDismiss }: { notif: AdminNotif; onDismiss: () => void }) {
  return (
    <div className="fixed top-4 left-0 right-0 flex justify-center z-[200] px-4 pointer-events-none">
      <div className="notif-toast bg-gray-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl max-w-sm w-full pointer-events-auto">
        <span className="text-xl flex-shrink-0">{ICONS[notif.type] || '🔔'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight truncate">{notif.message}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {new Date(notif.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={onDismiss} className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          <X size={12} className="text-gray-400" />
        </button>
      </div>
    </div>
  )
}

function NotifBell() {
  const { notifications, unread, markAllRead, clearAll } = useAdminNotif()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function toggle() {
    setOpen(v => !v)
    if (!open) markAllRead()
  }

  function handleClick(n: AdminNotif) {
    setOpen(false)
    navigate(ROUTES[n.type] || '/admin')
  }

  return (
    <>
      <button
        onClick={toggle}
        className="fixed top-4 right-4 z-[100] w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center active:scale-90 transition-transform"
      >
        <Bell size={18} className="text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="fixed top-16 right-4 z-[100] bg-white rounded-2xl shadow-2xl w-72 max-h-80 overflow-y-auto border border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <p className="text-sm font-bold">Уведомления</p>
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] text-gray-400 hover:text-gray-600">
                  Очистить
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-400">Нет уведомлений</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3"
                  >
                    <span className="text-lg mt-0.5 flex-shrink-0">{ICONS[n.type] || '🔔'}</span>
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
    </>
  )
}

export function AdminNotifProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AdminNotif[]>([])
  const [toast, setToast] = useState<AdminNotif | null>(null)
  const idRef = useRef(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    const token = localStorage.getItem('token')
    if (!token) return

    const base = import.meta.env.VITE_API_URL || '/api'
    const es = new EventSource(`${base}/admin/events?token=${encodeURIComponent(token)}`)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'connected') return
        const notif: AdminNotif = {
          id: ++idRef.current,
          type: data.type,
          message: data.message || '',
          ts: data.ts || Date.now(),
          read: false,
        }
        setNotifications(prev => [notif, ...prev].slice(0, 30))
        setToast(notif)
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(null), 4000)
      } catch {}
    }

    es.onerror = () => es.close()

    return () => {
      es.close()
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [user])

  const unread = notifications.filter(n => !n.read).length

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => setNotifications([]), [])

  return (
    <Ctx.Provider value={{ notifications, unread, markAllRead, clearAll }}>
      {children}
      <NotifBell />
      {toast && <NotifToast notif={toast} onDismiss={() => setToast(null)} />}
    </Ctx.Provider>
  )
}
