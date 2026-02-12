'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MarkAsPaidButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleMarkPaid = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark as paid')
      }

      setSuccess(true)
      setTimeout(() => router.refresh(), 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-center">
        <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-green-400 font-medium">Payment confirmed! Thank you.</p>
      </div>
    )
  }

  if (!confirmed) {
    return (
      <div className="card bg-green-600/10 border-green-500/30">
        <h3 className="text-white font-medium mb-2">Already paid?</h3>
        <p className="text-slate-400 text-sm mb-4">
          If you&apos;ve made the payment, let the contractor know by confirming below.
        </p>
        <button
          onClick={() => setConfirmed(true)}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          I&apos;ve Paid This Invoice
        </button>
      </div>
    )
  }

  return (
    <div className="card bg-amber-600/10 border-amber-500/30">
      <h3 className="text-amber-400 font-medium mb-2">Confirm payment</h3>
      <p className="text-slate-400 text-sm mb-4">
        Are you sure you want to mark this invoice as paid? The contractor will be notified.
      </p>
      {error && (
        <p className="text-red-400 text-sm mb-3">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => setConfirmed(false)}
          disabled={loading}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleMarkPaid}
          disabled={loading}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Confirming...
            </>
          ) : (
            'Yes, I\'ve Paid'
          )}
        </button>
      </div>
    </div>
  )
}
