'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CheckoutCompletePage() {
  const [synced, setSynced] = useState(false)
  const [appOpened, setAppOpened] = useState(false)

  useEffect(() => {
    // Sync subscription status with Stripe
    fetch('/api/stripe/verify', { method: 'POST' })
      .then(() => setSynced(true))
      .catch(() => setSynced(true)) // Continue even if sync fails

    // Try to open the Android app
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
    if (isMobile && /Android/i.test(navigator.userAgent)) {
      // Small delay to let verify start, then try to open app
      const timer = setTimeout(() => {
        window.location.href = 'intent://www.brickquote.app/requests#Intent;scheme=https;package=app.brickquote;end'
        setAppOpened(true)
      }, 1000)
      return () => clearTimeout(timer)
    }

    // Desktop: redirect to dashboard after sync
    if (!isMobile) {
      const timer = setTimeout(() => {
        window.location.href = '/requests?checkout=success'
      }, 1500)
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
          Your free trial is now active. Start creating quotes right away.
        </p>

        {/* Open in app button (mobile) */}
        <a
          href="intent://www.brickquote.app/requests#Intent;scheme=https;package=app.brickquote;end"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl text-lg transition inline-block mb-3"
        >
          Open in App
        </a>

        {/* Fallback web link */}
        <Link
          href="/requests"
          className="block text-slate-400 hover:text-white text-sm transition"
        >
          Continue in browser
        </Link>

        {!synced && (
          <p className="text-slate-600 text-xs mt-6">Activating your account...</p>
        )}
      </div>
    </div>
  )
}
