'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Starter',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
    description: 'Perfect for getting started',
    features: [
      '30 quotes per month',
      'AI chatbot for clients',
      'Email quote delivery',
      'Basic PDF exports',
      '7-day free trial',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    description: 'For growing businesses',
    features: [
      'Unlimited quotes',
      'Priority AI processing',
      'Custom branding on PDFs',
      'Advanced analytics',
      'Priority support',
      '7-day free trial',
    ],
    highlighted: true,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, stripe_price_id')
          .eq('id', user.id)
          .single()

        setSubscription(profile)
      }
    }
    getUser()
  }, [])

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!user) {
      router.push('/login?redirect=/pricing')
      return
    }

    setLoading(planName)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout')
    }

    setLoading(null)
  }

  const handleManageSubscription = async () => {
    setLoading('manage')

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Failed to open billing portal')
    }

    setLoading(null)
  }

  const isActive = subscription?.subscription_status === 'active' ||
                   subscription?.subscription_status === 'trialing'

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <span className="text-white font-bold text-xl">QuoteSnap</span>
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Start with a 7-day free trial. No credit card required to explore.
          </p>

          {canceled && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400">
              Checkout was canceled. Feel free to try again when you&apos;re ready.
            </div>
          )}
        </div>

        {/* Current subscription banner */}
        {isActive && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-green-400 font-medium">
                You have an active subscription
              </p>
              <p className="text-slate-400 text-sm">
                Status: {subscription?.subscription_status}
              </p>
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={loading === 'manage'}
              className="btn-secondary"
            >
              {loading === 'manage' ? 'Loading...' : 'Manage Subscription'}
            </button>
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`card relative ${
                plan.highlighted
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h2>
                <p className="text-slate-400">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-5xl font-bold text-white">
                  ${plan.price}
                </span>
                <span className="text-slate-400">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                disabled={loading === plan.name || isActive}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.name
                  ? 'Loading...'
                  : isActive
                  ? 'Current Plan'
                  : 'Start Free Trial'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-12 text-center">
          <p className="text-slate-400">
            Questions?{' '}
            <a href="mailto:support@quotesnap.com" className="text-blue-400 hover:text-blue-300">
              Contact us
            </a>
          </p>
        </div>

        {/* Back to app */}
        {user && (
          <div className="mt-8 text-center">
            <Link href="/requests" className="text-blue-400 hover:text-blue-300">
              ← Back to dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
