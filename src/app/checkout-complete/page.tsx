'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CheckoutCompletePage() {
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    // Sync subscription status with Stripe
    fetch('/api/stripe/verify', { method: 'POST' })
      .then(() => setSynced(true))
      .catch(() => setSynced(true))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          You&apos;re all set!
        </h1>
        <p className="text-slate-400 mb-8">
          Your free trial is now active. Start creating quotes right away.
        </p>

        {/* Primary: go to dashboard in browser */}
        <Link
          href="/requests"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl text-lg transition inline-block mb-4"
        >
          {synced ? 'Go to Dashboard' : 'Activating...'}
        </Link>

        {!synced && (
          <p className="text-slate-600 text-xs">Activating your account...</p>
        )}
      </div>
    </div>
  )
}
