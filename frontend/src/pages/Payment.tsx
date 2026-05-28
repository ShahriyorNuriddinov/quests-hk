import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Payment() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const questId = searchParams.get('questId')
  const intentId = searchParams.get('intent')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!intentId || !questId) {
      navigate('/quests', { replace: true })
      return
    }
    let tries = 0
    let timer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const poll = async () => {
      try {
        const r = await api.get(`/payments/intent/${intentId}`)
        if (cancelled) return
        if (r.data.status === 'succeeded') {
          setStatus('success')
          timer = setTimeout(() => navigate(`/quest/${questId}/play`, { replace: true }), 1500)
        } else if (r.data.status === 'failed') {
          setStatus('error')
        } else if (tries < 20) {
          tries++
          timer = setTimeout(poll, 1500)
        } else {
          setStatus('error')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    poll()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [intentId, questId])

  if (status === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-[#FFD600] flex items-center justify-center text-5xl mb-6">✓</div>
      <h2 className="text-2xl font-extrabold mb-2">Оплата прошла!</h2>
      <p className="text-gray-400 text-sm">Переходим к квесту...</p>
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="text-5xl mb-4">❌</div>
      <h2 className="text-2xl font-extrabold mb-2">Ошибка оплаты</h2>
      <p className="text-gray-400 text-sm mb-6">Платёж не прошёл. Попробуйте снова.</p>
      <button onClick={() => navigate(`/quest/${questId}/pay`)}
        className="bg-[#FFD600] font-bold px-6 py-3 rounded-2xl">
        Попробовать снова
      </button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm">Обрабатываем платёж...</p>
    </div>
  )
}
