import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { X } from 'lucide-react'

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

function NotifToast({ notif, onDismiss }: { notif: AdminNotif; onDismiss: () => void }) {
  return (
    <div className="fixed top-4 left-4 right-4 flex justify-center z-[200] pointer-events-none">
      <div className="notif-toast bg-gray-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl max-w-sm w-full pointer-events-auto">
        <span className="text-xl flex-shrink-0">{ICONS[notif.type] || '🔔'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight truncate">{notif.message}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {new Date(notif.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={onDismiss} className="flex-shrink-0">
          <X size={12} className="text-gray-400" />
        </button>
      </div>
    </div>
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

    const base = (import.meta.env.VITE_API_URL as string | undefined) || '/api'
    const url = `${base}/admin/stream?token=${encodeURIComponent(token)}`
    console.log('[SSE] connecting to', url)

    let es: EventSource
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      es = new EventSource(url)

      es.onopen = () => console.log('[SSE] connected')

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          console.log('[SSE] event:', data)
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
          toastTimer.current = setTimeout(() => setToast(null), 5000)
        } catch (err) {
          console.error('[SSE] parse error', err)
        }
      }

      es.onerror = (err) => {
        console.error('[SSE] error', err, 'readyState:', es.readyState)
        es.close()
        // retry after 5s
        retryTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      es?.close()
      if (retryTimer) clearTimeout(retryTimer)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [user])

  const unread = notifications.filter(n => !n.read).length
  const markAllRead = useCallback(() => setNotifications(p => p.map(n => ({ ...n, read: true }))), [])
  const clearAll = useCallback(() => setNotifications([]), [])

  return (
    <Ctx.Provider value={{ notifications, unread, markAllRead, clearAll }}>
      {children}
      {toast && <NotifToast notif={toast} onDismiss={() => setToast(null)} />}
    </Ctx.Provider>
  )
}
