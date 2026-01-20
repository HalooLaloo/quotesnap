import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

// QuoteSnap pricing
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 29,
    priceId: '', // Will be set after creating in Stripe
    features: [
      '30 quotes per month',
      'AI chatbot for clients',
      'Email quote delivery',
      'Basic analytics',
    ],
  },
  pro: {
    name: 'Pro',
    price: 49,
    priceId: '', // Will be set after creating in Stripe
    features: [
      'Unlimited quotes',
      'Priority AI processing',
      'Custom branding on PDFs',
      'Advanced analytics',
      'Priority support',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS
