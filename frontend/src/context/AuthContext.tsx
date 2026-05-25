import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../api/client'
import { supabase } from '../supabase'

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
  refreshUser: () => Promise<void>
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
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    if (error) throw error
  }

  async function verifyCode(email: string, code: string) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) throw error
    const r = await api.post('/auth/supabase-sync', { access_token: data.session!.access_token })
    localStorage.setItem('token', r.data.token)
    setUser(r.data.user)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  async function refreshUser() {
    const r = await api.get('/auth/me')
    setUser(r.data)
  }

  return <Ctx.Provider value={{ user, loading, sendCode, verifyCode, logout, refreshUser }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
