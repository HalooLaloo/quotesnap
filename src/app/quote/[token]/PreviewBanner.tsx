'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export function PreviewBanner({ quoteId }: { quoteId?: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (searchParams.get('preview') !== '1') return null

  const handleSend = async () => {
    if (!quoteId) return
    setSending(true)
    try {
      // Update status to sent
      const res = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      })
      if (res.ok) {
        setSent(true)
        setTimeout(() => {
          router.push(`/quotes/${quoteId}`)
        }, 1500)
      }
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-green-600 text-white px-4 py-3 rounded-lg mb-6 flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium text-sm">Quote sent to client! Redirecting...</span>
      </div>
    )
  }

  return (
    <div className="bg-amber-600 text-white px-4 py-3 rounded-lg mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="font-medium text-sm">Preview — this is what your client will see</span>
      </div>
      <div className="flex gap-2">
        <Link
          href={quoteId ? `/quotes/${quoteId}/edit` : '/quotes'}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Edit Quote
        </Link>
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white text-amber-700 hover:bg-white/90 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-amber-700/30 border-t-amber-700 rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send to Client
            </>
          )}
        </button>
      </div>
    </div>
  )
}
