'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SubscribePage() {
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [error, setError] = useState('')
  const [trialExpired, setTrialExpired] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [pageReady, setPageReady] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, trial_ends_at')
        .eq('id', user.id)
        .single()

      // Already has active paid subscription
      if (profile?.subscription_status === 'active') {
        router.push('/requests')
        return
      }

      // Check trial status
      if (profile?.trial_ends_at) {
        const trialEnd = new Date(profile.trial_ends_at)
        const now = new Date()
        if (trialEnd < now) {
          setTrialExpired(true)
        } else {
          const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          setTrialDaysLeft(daysLeft)
        }
      }

      setPageReady(true)
    }

    checkUser()
  }, [supabase, router])

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setLoading(plan)
    setError('')

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
        setError(data.error || 'Something went wrong')
        setLoading(null)
      }
    } catch (err) {
      void err
      setError('Failed to start checkout')
      setLoading(null)
    }
  }

  if (!pageReady) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
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
          {trialExpired ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-4">
                Your free trial has ended
              </h1>
              <p className="text-slate-400 text-lg">
                Choose a plan to continue using BrickQuote.
              </p>
            </>
          ) : trialDaysLeft !== null ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-4">
                Choose your plan
              </h1>
              <p className="text-slate-400 text-lg">
                You have <span className="text-blue-400 font-medium">{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}</span> left on your free trial.
                Subscribe now to avoid any interruption.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-4">
                Choose your plan
              </h1>
              <p className="text-slate-400 text-lg">
                Start using BrickQuote to send professional quotes in minutes.
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {/* Plan options */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Monthly */}
          <button
            onClick={() => handleSubscribe('monthly')}
            disabled={loading !== null}
            className="bg-[#132039] border border-[#1e3a5f] hover:border-blue-500 rounded-xl p-6 text-left transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Monthly</h3>
                <p className="text-slate-400 text-sm">Flexible, cancel anytime</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">$29</p>
                <p className="text-slate-400 text-sm">/month</p>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-blue-400 text-sm text-center font-medium">
              {loading === 'monthly' ? 'Redirecting to checkout...' : 'Get Started'}
            </div>
          </button>

          {/* Yearly */}
          <button
            onClick={() => handleSubscribe('yearly')}
            disabled={loading !== null}
            className="bg-[#132039] border-2 border-green-500 hover:border-green-400 rounded-xl p-6 text-left transition relative disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute -top-3 right-4">
              <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                Save $99
              </span>
            </div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Yearly</h3>
                <p className="text-slate-400 text-sm">Best value</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">$249</p>
                <p className="text-slate-400 text-sm">/year <span className="text-green-400">($20.75/mo)</span></p>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-green-400 text-sm text-center font-medium">
              {loading === 'yearly' ? 'Redirecting to checkout...' : 'Get Started — Save $99'}
            </div>
          </button>
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
        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm mb-4">Both plans include:</p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500">
            <span className="bg-[#132039] px-3 py-1 rounded-full">Unlimited quotes</span>
            <span className="bg-[#132039] px-3 py-1 rounded-full">AI photo analysis</span>
            <span className="bg-[#132039] px-3 py-1 rounded-full">AI chatbot</span>
            <span className="bg-[#132039] px-3 py-1 rounded-full">PDF generation</span>
            <span className="bg-[#132039] px-3 py-1 rounded-full">Client portal</span>
            <span className="bg-[#132039] px-3 py-1 rounded-full">Email notifications</span>
          </div>
        </div>

        {/* Back to app link (during active trial) */}
        {trialDaysLeft !== null && (
          <div className="mt-8 text-center">
            <Link href="/requests" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              Continue with free trial
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
