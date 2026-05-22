import express, { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { findQuestById } from '../models/Quest.js'
import { findPromoByCode, incrementPromoUsed, incrementPromoUsedByCode } from '../models/PromoCode.js'
import { addPurchasedQuest } from '../models/User.js'

const router = Router()

function airwallexBase() {
  return process.env.AIRWALLEX_ENV === 'demo'
    ? 'https://api-demo.airwallex.com/api/v1'
    : 'https://api.airwallex.com/api/v1'
}

async function getAirwallexToken() {
  const r = await fetch(`${airwallexBase()}/authentication/login`, {
    method: 'POST',
    headers: {
      'x-client-id': process.env.AIRWALLEX_CLIENT_ID || '',
      'x-api-key': process.env.AIRWALLEX_API_KEY || '',
      'Content-Type': 'application/json',
    },
  })
  const data = await r.json()
  return data.token
}

router.get('/promo/:code', requireAuth, async (req, res) => {
  const promo = await findPromoByCode(req.params.code, true)
  if (!promo || promo.usedCount >= promo.maxUses) {
    return res.status(404).json({ error: 'Promo not found or expired' })
  }
  res.json({ discount: promo.discount, type: promo.type, code: promo.code })
})

router.post('/checkout', requireAuth, async (req, res) => {
  const { questId, promoCode } = req.body
  const quest = await findQuestById(questId)
  if (!quest) return res.status(404).json({ error: 'Quest not found' })

  let amount = quest.price
  let appliedPromo = null

  if (promoCode) {
    const promo = await findPromoByCode(promoCode, true)
    if (promo && promo.usedCount < promo.maxUses) {
      appliedPromo = promo
      amount = promo.type === 'percent'
        ? Math.round(amount * (1 - promo.discount / 100))
        : Math.max(0, amount - promo.discount)
    }
  }

  // Free quest or no payment keys — grant access directly
  if (amount <= 0 || !process.env.AIRWALLEX_CLIENT_ID) {
    await addPurchasedQuest(req.user.id, questId)
    if (appliedPromo) await incrementPromoUsed(appliedPromo.id)
    return res.json({ url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/quest/${questId}?status=success` })
  }

  try {
    const awToken = await getAirwallexToken()
    const currencyMap = { 'HK$': 'HKD', 'USD': 'USD', 'RUB': 'RUB', 'CNY': 'CNY' }
    const currency = currencyMap[quest.currency] || 'HKD'

    const intentRes = await fetch(`${airwallexBase()}/pa/payment_intents/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${awToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency,
        merchant_order_id: `${req.user.id}_${questId}_${Date.now()}`,
        return_url: `${process.env.FRONTEND_URL}/quest/${questId}?status=success`,
        metadata: { userId: req.user.id, questId, promoCode: appliedPromo?.code },
      }),
    })
    const intent = await intentRes.json()
    res.json({
      url: `${process.env.FRONTEND_URL}/payment?intent=${intent.id}&client_secret=${intent.client_secret}&questId=${questId}`,
    })
  } catch (err) {
    console.error('Airwallex error:', err)
    res.status(500).json({ error: 'Payment error' })
  }
})

router.post('/webhook/airwallex', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = JSON.parse(req.body)
    // Verify the event came from Airwallex via shared webhook secret
    const webhookSecret = process.env.AIRWALLEX_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = req.headers['x-airwallex-signature']
      if (!signature || signature !== webhookSecret) {
        return res.status(401).json({ error: 'Invalid signature' })
      }
    }
    if (event.name === 'payment_intent.succeeded') {
      const { userId, questId, promoCode } = event.data?.object?.metadata || {}
      if (userId && questId) {
        await addPurchasedQuest(userId, questId)
        if (promoCode) await incrementPromoUsedByCode(promoCode)
      }
    }
    res.json({ ok: true })
  } catch {
    res.status(400).json({ error: 'Webhook error' })
  }
})

export default router
