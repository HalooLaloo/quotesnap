'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { initPostHog } from '@/lib/posthog'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('bq_cookie_consent')
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('bq_cookie_consent', 'accepted')
    setVisible(false)
    initPostHog()
  }

  const handleDecline = () => {
    localStorage.setItem('bq_cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-xl mx-auto bg-[#132039] border border-[#1e3a5f] rounded-xl p-4 shadow-2xl">
        <p className="text-slate-300 text-sm mb-3">
          We use cookies for analytics to improve your experience.{' '}
          <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
