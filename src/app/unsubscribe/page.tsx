'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('uid')
  const [status, setStatus] = useState<'loading' | 'done' | 'error' | 'resubscribed'>('loading')

  useEffect(() => {
    if (!userId) {
      setStatus('error')
      return
    }

    fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'unsubscribe' }),
    })
      .then(res => {
        if (!res.ok) throw new Error()
        setStatus('done')
      })
      .catch(() => setStatus('error'))
  }, [userId])

  const handleResubscribe = async () => {
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'resubscribe' }),
      })
      if (!res.ok) throw new Error()
      setStatus('resubscribed')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a1628]">
      <div className="w-full max-w-md text-center">
        <div className="w-12 h-12 bg-[#132039] rounded-lg flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="6" width="9" height="5" rx="0.5" />
            <rect x="13" y="6" width="9" height="5" rx="0.5" />
            <rect x="6" y="13" width="9" height="5" rx="0.5" />
            <rect x="17" y="13" width="5" height="5" rx="0.5" />
            <rect x="2" y="13" width="2" height="5" rx="0.5" />
          </svg>
        </div>

        {status === 'loading' && (
          <div>
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Processing...</p>
          </div>
        )}

        {status === 'done' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-3">Unsubscribed</h1>
            <p className="text-slate-400 mb-6">
              You will no longer receive notification emails from BrickQuote.
            </p>
            <button
              onClick={handleResubscribe}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Changed your mind? Re-subscribe
            </button>
          </div>
        )}

        {status === 'resubscribed' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-3">Re-subscribed</h1>
            <p className="text-slate-400">
              You will receive notification emails again.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-slate-400">
              Please try again or contact{' '}
              <Link href="/contact" className="text-blue-400 hover:text-blue-300">support</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
