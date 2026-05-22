import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../api/client'

interface User {
  id: string
  email: string
  role: 'user' | 'admin'
  purchasedQuests: string[]
}

interface AuthCtx {
  user: User | null
  loading: boolean
  sendCode: (email: string) => Promise<void>
  verifyCode: (email: string, code: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me').then(r => setUser(r.data)).catch(() => {
        localStorage.removeItem('token')
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function sendCode(email: string) {
    await api.post('/auth/send-code', { email })
  }

  async function verifyCode(email: string, code: string) {
    const r = await api.post('/auth/verify-code', { email, code })
    localStorage.setItem('token', r.data.token)
    setUser(r.data.user)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, sendCode, verifyCode, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
