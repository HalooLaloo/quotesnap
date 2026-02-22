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

      // Already has active subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      if (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing') {
        router.push('/requests')
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
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
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

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Try BrickQuote free for 3 days
          </h1>
          <p className="text-slate-400 text-lg">
            Full access to everything. No charge until the trial ends.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {/* Single CTA */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {loading ? 'Redirecting to checkout...' : 'Start Free Trial'}
        </button>

        <p className="text-center text-slate-500 text-sm mb-8">
          Then $29/month after trial. Switch to yearly ($249/year) anytime in Settings and save $99.
        </p>

        {/* How it works */}
        <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-5 mb-8">
          <p className="text-white text-sm font-medium mb-3">How it works:</p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">1</span>
              </div>
              <p className="text-slate-300">Enter your card — <span className="text-white font-medium">you won&apos;t be charged today</span></p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">2</span>
              </div>
              <p className="text-slate-300">Get <span className="text-white font-medium">full access for 3 days</span> — create quotes, use AI, send to clients</p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">3</span>
              </div>
              <p className="text-slate-300">After 3 days, $29/month starts. <span className="text-white font-medium">Cancel anytime</span> — no charge</p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>30-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Secure payment via Stripe</span>
          </div>
        </div>

        {/* Features */}
        <div className="mt-10 text-center">
          <p className="text-slate-400 text-sm mb-4">Everything included:</p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500">
            <span className="bg-[#132039] px-3 py-1 rounded-full">Unlimited quotes</span>
            <span className="bg-[#132039] px-3 py-1 rounded-full">AI photo analysis</span>
            <span className="bg-[#132039] px-3 py-1 rounded-full">AI chatbot</span>
            <span className="bg-[#132039] px-3 py-1 rounded-full">PDF generation</span>
            <span className="bg-[#132039] px-3 py-1 rounded-full">Client portal</span>
            <span className="bg-[#132039] px-3 py-1 rounded-full">Email notifications</span>
          </div>
        </div>
      </div>
    </div>
  )
}
