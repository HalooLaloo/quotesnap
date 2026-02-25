import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = (process.env.STRIPE_SECRET_KEY || '').trim()
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
    _stripe = new Stripe(key, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return _stripe
}

// BrickQuote pricing
export const PLANS = {
  monthly: {
    name: 'Pro Monthly',
    price: 29,
    interval: 'month',
    priceId: (process.env.STRIPE_MONTHLY_PRICE_ID || '').trim(),
    trialDays: 3,
    features: [
      'Unlimited quotes & invoices',
      'AI photo analysis',
      'AI line item suggestions',
      'AI chatbot for clients',
      'Client request portal',
      'Online quote acceptance',
      'Professional PDF generation',
      'Email notifications',
      'Service catalog',
      'Payment tracking',
      'Priority support',
    ],
  },
  yearly: {
    name: 'Pro Yearly',
    price: 249,
    interval: 'year',
    priceId: (process.env.STRIPE_YEARLY_PRICE_ID || '').trim(),
    trialDays: 3,
    savings: 99,
    features: [
      'Everything in monthly',
      'Save $99 per year',
      'Save $99 (3+ months free)',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS

/** Resolve a Stripe price ID to a plan type ('monthly' | 'yearly') */
export function getPlanTypeFromPriceId(priceId: string | null): PlanType | null {
  if (!priceId) return null
  if (priceId === PLANS.monthly.priceId) return 'monthly'
  if (priceId === PLANS.yearly.priceId) return 'yearly'
  return null
}

// Billing Portal configuration with plan switching enabled
// NOTE: Not currently used — plan switching is handled by /api/stripe/switch-plan inline
let _portalConfigId: string | null = null

export async function getPortalConfigId(): Promise<string | undefined> {
  if (_portalConfigId) return _portalConfigId

  const stripe = getStripe()
  const monthlyPriceId = PLANS.monthly.priceId
  const yearlyPriceId = PLANS.yearly.priceId

  if (!monthlyPriceId || !yearlyPriceId) return undefined

  // Get product IDs for both prices (they may be on different products)
  const [monthlyPrice, yearlyPrice] = await Promise.all([
    stripe.prices.retrieve(monthlyPriceId),
    stripe.prices.retrieve(yearlyPriceId),
  ])
  const monthlyProductId = typeof monthlyPrice.product === 'string' ? monthlyPrice.product : monthlyPrice.product.id
  const yearlyProductId = typeof yearlyPrice.product === 'string' ? yearlyPrice.product : yearlyPrice.product.id

  // Build products array — handle same or different products
  const products = monthlyProductId === yearlyProductId
    ? [{ product: monthlyProductId, prices: [monthlyPriceId, yearlyPriceId] }]
    : [
        { product: monthlyProductId, prices: [monthlyPriceId] },
        { product: yearlyProductId, prices: [yearlyPriceId] },
      ]

  const config = await stripe.billingPortal.configurations.create({
    features: {
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        products,
      },
      subscription_cancel: { enabled: true, mode: 'at_period_end' },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
    },
    business_profile: {
      headline: 'Manage your BrickQuote subscription',
    },
  })

  _portalConfigId = config.id
  return config.id
}
