'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

interface Subscription {
  subscription_status: string | null
  stripe_price_id: string | null
}

const FEATURES = [
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
]

function PricingContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

  const supabase = useMemo(() => createClient(), [])

  const getUser = useCallback(async () => {
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
  }, [supabase])

  useEffect(() => {
    getUser()
  }, [getUser])

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      router.push('/register')
      return
    }

    setLoading(plan)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
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
    <div className="min-h-screen bg-[#0a1628] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#132039] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="9" height="5" rx="0.5" />
                <rect x="13" y="6" width="9" height="5" rx="0.5" />
                <rect x="6" y="13" width="9" height="5" rx="0.5" />
                <rect x="17" y="13" width="5" height="5" rx="0.5" />
                <rect x="2" y="13" width="2" height="5" rx="0.5" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl">BrickQuote</span>
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            One plan with everything you need. Choose monthly or save with yearly.
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
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading === 'manage' ? 'Loading...' : 'Manage Subscription'}
            </button>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              billingPeriod === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              billingPeriod === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Yearly
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Save $99
            </span>
          </button>
        </div>

        {/* Pricing card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-[#132039] border-2 border-blue-500 rounded-xl p-8 relative">
            {billingPeriod === 'monthly' ? (
              <>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                    3-day free trial
                  </span>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Pro Monthly</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-5xl font-bold text-white">$29</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Try free for 3 days, then $29/month
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                    Best value - Save $99
                  </span>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Pro Yearly</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-5xl font-bold text-white">$249</span>
                    <span className="text-slate-400">/year</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    <span className="line-through">$348</span> - 2 months free!
                  </p>
                </div>
              </>
            )}

            <ul className="space-y-3 mb-8">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(billingPeriod)}
              disabled={loading === billingPeriod || isActive}
              className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === billingPeriod
                ? 'Loading...'
                : isActive
                ? 'Already subscribed'
                : billingPeriod === 'monthly'
                ? 'Start 3-day free trial'
                : 'Subscribe now - Save $99'}
            </button>

            <p className="text-xs text-slate-500 text-center mt-3">
              {billingPeriod === 'monthly'
                ? 'Credit card required • Cancel anytime before trial ends'
                : '30-day money-back guarantee • Cancel anytime'}
            </p>
          </div>

          {/* Money back guarantee */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm text-green-400 font-medium">30-day money-back guarantee</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 space-y-4">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently asked questions
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
              <h3 className="text-white font-medium mb-2">How does the free trial work?</h3>
              <p className="text-slate-400 text-sm">
                You get 3 days of full access. A credit card is required to start, but you won&apos;t be charged during the trial. Cancel anytime before it ends.
              </p>
            </div>

            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
              <h3 className="text-white font-medium mb-2">Can I cancel anytime?</h3>
              <p className="text-slate-400 text-sm">
                Yes! Cancel with one click in your account settings. No questions asked, no hidden fees.
              </p>
            </div>

            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
              <h3 className="text-white font-medium mb-2">What happens after I cancel?</h3>
              <p className="text-slate-400 text-sm">
                You keep access until the end of your billing period. Your data stays safe and you can reactivate anytime.
              </p>
            </div>

            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6">
              <h3 className="text-white font-medium mb-2">Is there a refund policy?</h3>
              <p className="text-slate-400 text-sm">
                Yes, we offer a 30-day money-back guarantee. If you&apos;re not satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-slate-400">
            Questions?{' '}
            <Link href="/contact" className="text-blue-400 hover:text-blue-300">
              Contact us
            </Link>
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

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1628] flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <PricingContent />
    </Suspense>
  )
}
