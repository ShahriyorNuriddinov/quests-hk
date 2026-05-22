import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ReactNode } from 'react'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" /></div>
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
