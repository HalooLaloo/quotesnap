'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pastDue, setPastDue] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showPromo, setShowPromo] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check local status first
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing') {
        router.push('/requests')
        return
      }

      if (profile?.subscription_status === 'past_due') {
        setPastDue(true)
        return
      }

      // If user has a Stripe customer (went through checkout) but status not updated yet,
      // verify directly with Stripe (handles webhook race condition)
      if (profile?.stripe_customer_id) {
        const res = await fetch('/api/stripe/verify', { method: 'POST' })
        const data = await res.json()
        if (data.status === 'active' || data.status === 'trialing') {
          router.push('/requests')
        } else if (data.status === 'past_due') {
          setPastDue(true)
        }
      }
    }

    checkUser()
  }, [supabase, router])

  const handleUpdatePayment = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Could not open billing portal')
      }
    } catch {
      setError('Something went wrong')
    }
    setPortalLoading(false)
  }

  const handlePromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setError('')

    try {
      const res = await fetch('/api/promo/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      })
      const data = await res.json()

      if (data.success) {
        router.push('/requests')
      } else {
        setError(data.error || 'Invalid promo code')
        setPromoLoading(false)
      }
    } catch {
      setError('Failed to activate promo code')
      setPromoLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'monthly' }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong')
        setLoading(false)
      }
    } catch (err) {
      void err
      setError('Failed to start checkout')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#132039] flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="9.5" height="5" rx="0.7" />
                <rect x="12.5" y="6" width="9.5" height="5" rx="0.7" />
                <rect x="2" y="12.5" width="3.5" height="5" rx="0.7" />
                <rect x="6.5" y="12.5" width="9.5" height="5" rx="0.7" />
                <rect x="17" y="12.5" width="5" height="5" rx="0.7" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">BrickQuote</span>
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-5 text-center">
            {error}
          </div>
        )}

        {pastDue ? (
          <>
            {/* Past Due — payment failed */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Payment failed
              </h1>
              <p className="text-slate-400 text-lg">
                Your last payment didn&apos;t go through. Update your payment method to restore access.
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
              <p className="text-red-400 text-sm mb-1 font-medium">What happened?</p>
              <p className="text-slate-400 text-sm">
                Your card was declined or expired. Your data is safe — update your payment method and you&apos;ll be back instantly.
              </p>
            </div>

            <button
              onClick={handleUpdatePayment}
              disabled={portalLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl text-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {portalLoading ? 'Opening...' : 'Update Payment Method'}
            </button>

            <p className="text-slate-500 text-sm text-center">
              You&apos;ll be redirected to Stripe to update your card.
            </p>
          </>
        ) : (
          <>
            {/* Normal subscribe flow */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                Your account is ready
              </h1>
              <p className="text-slate-400 text-lg">
                Activate your <span className="text-white font-medium">free 3-day access</span> to start quoting
              </p>
            </div>

            {/* Early adopter pricing card */}
            <div className="relative bg-gradient-to-b from-[#162a4a] to-[#132039] border border-blue-500/30 rounded-2xl overflow-hidden mb-5">
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

              <div className="relative p-6">
                {/* Badge */}
                <div className="flex justify-center mb-5">
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-sm text-amber-400 font-medium">Early Adopter Pricing</span>
                  </div>
                </div>

                {/* Trial highlight */}
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/25 rounded-full px-4 py-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-blue-300 font-semibold text-sm">3-day free trial</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-center mb-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold text-white tracking-tight">$29</span>
                    <span className="text-lg text-slate-400 font-medium">/mo</span>
                  </div>
                </div>

                <p className="text-center text-slate-500 text-sm mb-5">
                  or <span className="text-white font-semibold">$249/year</span> <span className="text-green-400">(save $99)</span>
                </p>

                {/* Price lock & increase messaging */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-[#0d1f35] rounded-lg px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-xs"><span className="text-white font-semibold">Price locked for you</span> — keep $29/mo forever</p>
                  </div>

                  <div className="flex items-center gap-3 bg-[#0d1f35] rounded-lg px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-xs"><span className="text-white font-semibold">Price may increase</span> for future users</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl text-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? 'Redirecting...' : 'Start Free Trial'}
            </button>

            {/* Cancel reassurance — prominent */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-slate-400 text-sm">
                Cancel in one click, anytime. <span className="text-white">No charge if you cancel within 3 days.</span>
              </span>
            </div>

            {/* Promo code */}
            <div className="mb-6">
              {!showPromo ? (
                <button
                  onClick={() => setShowPromo(true)}
                  className="text-slate-500 text-sm hover:text-slate-300 transition underline underline-offset-2 w-full text-center"
                >
                  Have a promo code?
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePromo()}
                    placeholder="Enter code"
                    className="flex-1 bg-[#0d1f35] border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    autoFocus
                  />
                  <button
                    onClick={handlePromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="bg-green-600 hover:bg-green-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {promoLoading ? 'Activating...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* What you get — compact */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                'Unlimited quotes',
                'AI photo analysis',
                'AI chatbot',
                'PDF generation',
                'Client portal',
                'Email notifications',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-400">{feature}</span>
                </div>
              ))}
            </div>

            {/* Trust footer */}
            <div className="flex items-center justify-center gap-4 text-slate-600 text-xs">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure via Stripe</span>
              </div>
              <span>|</span>
              <span>30-day money-back guarantee</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
