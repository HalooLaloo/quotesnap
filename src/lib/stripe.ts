import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})

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
