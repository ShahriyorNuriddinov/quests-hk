import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CreditCard, Smartphone, Tag, Shield, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Quest {
  _id: string
  title: string
  description: string
  price: number
  currency: string
  coverImage?: string
  duration?: string
  distance?: string
  freePromoLeft?: number
  partnerId?: string
}

interface PromoInfo {
  discount: number
  type: 'percent' | 'fixed'
  code: string
}

const METHODS = [
  { id: 'card_int',      icon: '💳', label: 'Visa / Mastercard',    sub: 'Международные карты' },
  { id: 'card_ru',       icon: '🇷🇺', label: 'Карта РФ',            sub: 'Мир, Visa, MC' },
  { id: 'alipay_wechat', icon: '📱', label: 'Alipay / WeChat Pay',  sub: 'Для китайских карт' },
  { id: 'alipay_hk',     icon: '🟡', label: 'Alipay HK',            sub: 'Гонконгский Alipay' },
]

function calcFinal(price: number, promo: PromoInfo | null) {
  if (!promo) return price
  return promo.type === 'percent'
    ? Math.round(price * (1 - promo.discount / 100))
    : Math.max(0, price - promo.discount)
}

function DemoCard({ onPay, loading, amount, currency }: {
  onPay: () => void; loading: boolean; amount: number; currency: string
}) {
  const [cardNum, setCardNum] = useState('4111 1111 1111 1111')
  const [expiry, setExpiry] = useState('12/26')
  const [cvv, setCvv] = useState('123')
  const [name, setName] = useState('TEST USER')

  function formatCard(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4)
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Card visual */}
      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-4 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
        <p className="text-[10px] text-white/50 uppercase tracking-widest mb-3">Test Card</p>
        <p className="font-mono text-base tracking-widest mb-4">{cardNum || '•••• •••• •••• ••••'}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] text-white/40 uppercase">Держатель</p>
            <p className="text-xs font-semibold tracking-wider">{name || 'CARD HOLDER'}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/40 uppercase">Срок</p>
            <p className="text-xs font-semibold">{expiry || 'MM/YY'}</p>
          </div>
          <div className="w-10 h-7 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-90" />
        </div>
      </div>

      {/* Card fields */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Номер карты</label>
          <input value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))}
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-[#FFD600]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Срок действия</label>
            <input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY" maxLength={5}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-[#FFD600]" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CVV</label>
            <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="•••" maxLength={3} type="password"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-[#FFD600]" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Имя на карте</label>
          <input value={name} onChange={e => setName(e.target.value.toUpperCase())}
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-[#FFD600]" />
        </div>
      </div>

      <div className="px-4 pb-4">
        <button onClick={onPay} disabled={loading}
          className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
          {loading
            ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Обрабатываем...</>
            : `Оплатить ${amount} ${currency}`
          }
        </button>
      </div>
    </div>
  )
}

export default function QuestPay() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [quest, setQuest] = useState<Quest | null>(null)
  const [promo, setPromo] = useState('')
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoInfo, setPromoInfo] = useState<PromoInfo | null>(null)
  const [promoError, setPromoError] = useState('')
  const [promoChecking, setPromoChecking] = useState(false)
  const [method, setMethod] = useState('card_int')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const promoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    if (user.purchasedQuests.includes(id!)) {
      navigate(`/quest/${id}/play`, { replace: true }); return
    }
    api.get(`/quests/${id}`).then(r => setQuest(r.data))
    api.get('/payments/mode').then(r => setIsDemo(r.data.demo)).catch(() => {})
  }, [id, user])

  useEffect(() => {
    setPromoInfo(null); setPromoError('')
    if (!promo.trim()) return
    if (promoTimer.current) clearTimeout(promoTimer.current)
    promoTimer.current = setTimeout(async () => {
      setPromoChecking(true)
      try {
        const r = await api.get(`/payments/promo/${promo.trim()}`)
        setPromoInfo(r.data); setPromoError('')
      } catch { setPromoError('Промо код не найден или истёк') }
      finally { setPromoChecking(false) }
    }, 600)
  }, [promo])

  async function handlePay() {
    setError(''); setLoading(true)
    try {
      const r = await api.post('/payments/checkout', {
        questId: id,
        promoCode: promoInfo ? promoInfo.code : undefined,
      })
      window.location.href = r.data.url
    } catch { setError('Ошибка оплаты. Попробуйте ещё раз.') }
    finally { setLoading(false) }
  }

  if (!quest) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isFreePartner = (quest.freePromoLeft ?? 0) > 0
  const finalPrice = isFreePartner ? 0 : calcFinal(quest.price, promoInfo)
  const hasDiscount = !isFreePartner && promoInfo && finalPrice < quest.price

  return (
    <div className="min-h-screen bg-gray-50 pb-36">

      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-base">
          ←
        </button>
        <h1 className="text-lg font-extrabold">Оформление</h1>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3 max-w-lg mx-auto">

        {/* Quest card */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="relative h-40">
            {quest.coverImage
              ? <img src={quest.coverImage} alt={quest.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-yellow-200 to-yellow-400" />
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-white font-extrabold text-base leading-snug">{quest.title}</p>
              {(quest.duration || quest.distance) && (
                <p className="text-white/70 text-xs mt-0.5">{[quest.duration, quest.distance].filter(Boolean).join(' · ')}</p>
              )}
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Стоимость квеста</span>
            <div className="flex items-center gap-2">
              {(hasDiscount || isFreePartner) && (
                <span className="text-sm text-gray-400 line-through">{quest.price} {quest.currency}</span>
              )}
              <span className={`text-xl font-extrabold ${(hasDiscount || isFreePartner) ? 'text-green-600' : 'text-gray-900'}`}>
                {isFreePartner ? 'Бесплатно' : `${finalPrice} ${quest.currency}`}
              </span>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">✉️</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 mb-0.5">Квест придёт на почту</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Demo card OR regular payment methods */}
        {isDemo && !isFreePartner ? (
          <DemoCard onPay={handlePay} loading={loading} amount={finalPrice} currency={quest.currency} />
        ) : !isFreePartner ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-4 pt-4 pb-2">Способ оплаты</p>
            {METHODS.map((m, i) => (
              <label key={m.id}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                  method === m.id ? 'bg-yellow-50' : 'bg-white'
                } ${i < METHODS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <input type="radio" name="method" value={m.id} checked={method === m.id}
                  onChange={() => setMethod(m.id)} className="hidden" />
                <span className="text-xl w-7 text-center flex-shrink-0">{m.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.sub}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  method === m.id ? 'border-[#FFD600] bg-[#FFD600]' : 'border-gray-200'
                }`}>
                  {method === m.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </label>
            ))}
          </div>
        ) : null}

        {/* Promo code */}
        {!isFreePartner && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button type="button" onClick={() => setPromoOpen(o => !o)}
              className="w-full flex items-center gap-3 px-4 py-3.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${promoInfo ? 'bg-green-50' : 'bg-gray-50'}`}>
                {promoInfo ? <CheckCircle2 size={15} className="text-green-500" /> : <Tag size={15} className="text-gray-400" />}
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-semibold text-gray-700">{promoInfo ? promo : (promo || 'Промо код')}</span>
                {promoInfo && (
                  <p className="text-xs text-green-600 font-medium mt-0.5">
                    −{promoInfo.discount}{promoInfo.type === 'percent' ? '%' : ` ${quest.currency}`} скидка применена
                  </p>
                )}
              </div>
              {promoOpen ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
            </button>
            {promoOpen && (
              <div className="px-4 pb-4">
                <div className="relative">
                  <input type="text" value={promo} onChange={e => setPromo(e.target.value.toUpperCase())}
                    placeholder="Введите промо код"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none uppercase tracking-widest font-semibold pr-10 ${
                      promoInfo ? 'border-green-300 bg-green-50' : promoError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#FFD600]'
                    }`} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {promoChecking && <Loader2 size={15} className="text-gray-400 animate-spin" />}
                    {!promoChecking && promoInfo && <CheckCircle2 size={15} className="text-green-500" />}
                  </div>
                </div>
                {promoError && <p className="text-xs text-red-500 mt-1.5">{promoError}</p>}
              </div>
            )}
          </div>
        )}

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 py-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><Shield size={12} />SSL</div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><CreditCard size={12} />Airwallex</div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><Smartphone size={12} />3D Secure</div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>

      {/* Bottom CTA — shown only when NOT demo and NOT free */}
      {!isDemo && !isFreePartner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
          <div className="max-w-lg mx-auto">
            <button onClick={handlePay} disabled={loading}
              className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base disabled:opacity-50 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Обрабатываем...</>
                : `Оплатить ${finalPrice} ${quest.currency}`
              }
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-2.5">
              Нажимая «Оплатить», вы соглашаетесь с{' '}
              <a href="/faq" className="text-gray-500 underline">политикой конфиденциальности</a>
            </p>
          </div>
        </div>
      )}

      {/* Free partner quest CTA */}
      {isFreePartner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
          <div className="max-w-lg mx-auto">
            <button onClick={handlePay} disabled={loading}
              className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base disabled:opacity-50 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Обрабатываем...</>
                : '🎁 Получить бесплатно'
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
