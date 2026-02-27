'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CheckoutCompletePage() {
  const [synced, setSynced] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Sync subscription status with Stripe
    fetch('/api/stripe/verify', { method: 'POST' })
      .then(() => setSynced(true))
      .catch(() => setSynced(true))

    const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
    setIsMobile(mobile)

    // Desktop: auto-redirect to dashboard after sync
    if (!mobile) {
      const timer = setTimeout(() => {
        window.location.href = '/requests?checkout=success'
      }, 2000)
      return () => clearTimeout(timer)
    }
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
          Your free trial is now active.
        </p>

        {isMobile ? (
          <>
            {/* Mobile: tell user to open the app */}
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0a1628] flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="9.5" height="5" rx="0.7" />
                <rect x="12.5" y="6" width="9.5" height="5" rx="0.7" />
                <rect x="2" y="12.5" width="3.5" height="5" rx="0.7" />
                <rect x="6.5" y="12.5" width="9.5" height="5" rx="0.7" />
                <rect x="17" y="12.5" width="5" height="5" rx="0.7" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg mb-1">
                Open the BrickQuote app
              </p>
              <p className="text-slate-400 text-sm">
                You can close this tab and open the app from your home screen. You&apos;re ready to go!
              </p>
            </div>

            <Link
              href="/requests"
              className="text-slate-500 hover:text-slate-300 text-sm transition"
            >
              or continue in browser &rarr;
            </Link>
          </>
        ) : (
          <p className="text-slate-500 text-sm">
            {synced ? 'Redirecting to dashboard...' : 'Activating your account...'}
          </p>
        )}
      </div>
    </div>
  )
}
