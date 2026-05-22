import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

export default function Auth() {
  const { t } = useTranslation()
  const { sendCode, verifyCode } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('from') || '/quests'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendCode(email)
      setStep('code')
    } catch {
      setError(t('auth.error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyCode(email, code)
      navigate(returnTo, { replace: true })
    } catch {
      setError(t('auth.codeError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate(-1)} className="text-gray-400 mb-6 flex items-center gap-1 text-sm">
          ← {t('back')}
        </button>

        <h1 className="text-2xl font-extrabold mb-2">{t('auth.title')}</h1>

        {step === 'email' ? (
          <form onSubmit={handleEmail} className="flex flex-col gap-4 mt-6">
            <p className="text-gray-500 text-sm">{t('auth.enterEmail')}</p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#FFD600] focus:ring-2 focus:ring-[#FFD600]/30"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-yellow disabled:opacity-60">
              {loading ? '...' : t('auth.sendCode')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCode} className="flex flex-col gap-4 mt-6">
            <p className="text-gray-500 text-sm">{t('auth.enterCode')} <span className="font-medium text-black">{email}</span></p>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              required
              className="border border-gray-200 rounded-xl px-4 py-3 text-xl text-center tracking-widest focus:outline-none focus:border-[#FFD600] focus:ring-2 focus:ring-[#FFD600]/30"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-yellow disabled:opacity-60">
              {loading ? '...' : t('auth.confirm')}
            </button>
            <button type="button" onClick={() => setStep('email')} className="text-sm text-gray-400 underline text-center">
              {t('auth.changeEmail')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
