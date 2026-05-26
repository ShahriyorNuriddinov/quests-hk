import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PartnerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  if (user.role !== 'partner' && user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
