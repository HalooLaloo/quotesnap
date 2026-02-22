'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

      // If user has a Stripe customer (went through checkout) but status not updated yet,
      // verify directly with Stripe (handles webhook race condition)
      if (profile?.stripe_customer_id) {
        const res = await fetch('/api/stripe/verify', { method: 'POST' })
        const data = await res.json()
        if (data.status === 'active' || data.status === 'trialing') {
          router.push('/requests')
        }
      }
    }

    checkUser()
  }, [supabase, router])

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
                <rect x="2" y="6" width="9" height="5" rx="0.5" />
                <rect x="13" y="6" width="9" height="5" rx="0.5" />
                <rect x="6" y="13" width="9" height="5" rx="0.5" />
                <rect x="17" y="13" width="5" height="5" rx="0.5" />
                <rect x="2" y="13" width="2" height="5" rx="0.5" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">BrickQuote</span>
          </Link>
        </div>

        {/* Headline */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Your account is ready
          </h1>
          <p className="text-slate-400 text-lg">
            Activate your <span className="text-white font-medium">free 3-day access</span> to start quoting
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-5 text-center">
            {error}
          </div>
        )}

        {/* Early adopter pricing */}
        <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl overflow-hidden mb-5">
          <div className="p-5 flex items-center justify-between">
            <div>
              <span className="bg-orange-500/20 text-orange-400 text-xs font-semibold px-2 py-0.5 rounded-full">Early Adopter Price</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-slate-500">for 3 days</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs">then</p>
              <p className="text-xl font-semibold text-white">$29<span className="text-sm text-slate-400 font-normal">/mo</span></p>
              <p className="text-orange-400/80 text-xs">locked in for you</p>
            </div>
          </div>
          <div className="px-5 py-2.5 bg-orange-500/5 border-t border-orange-500/10 flex items-center justify-between">
            <span className="text-slate-500 text-xs">Price may increase for future users</span>
            <span className="text-green-400/80 text-xs font-medium">Switch to yearly &rarr; save $99</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl text-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          {loading ? 'Redirecting...' : 'Get Instant Access — Free'}
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
      </div>
    </div>
  )
}
