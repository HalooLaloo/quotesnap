'use client'

import { useState } from 'react'

interface QuoteActionsProps {
  token: string
  disabled?: boolean
}

export function QuoteActions({ token, disabled }: QuoteActionsProps) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleAction = async (action: 'accept' | 'reject') => {
    if (disabled) return
    setLoading(action)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/accept-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        void text
        throw new Error('Server error occurred. Please try again.')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process')
      }

      setSuccess(true)
      // Wait a moment then refresh
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      void err
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(null)
    }
  }

  if (success) {
    return (
      <div className="card bg-green-600/20 border-green-500/30">
        <div className="flex items-center justify-center gap-3 py-4">
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-400 font-medium">Saved! Refreshing...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${disabled ? 'opacity-60' : ''}`}>
      <h3 className="font-medium text-white mb-4 text-center">Your decision</h3>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => handleAction('reject')}
          disabled={disabled || loading !== null || success}
          className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject
        </button>

        <button
          onClick={() => handleAction('accept')}
          disabled={disabled || loading !== null || success}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Accept Quote
        </button>
      </div>

      <p className="text-slate-500 text-xs text-center mt-4">
        By accepting, you agree to proceed with the work. The contractor will be notified.
      </p>
    </div>
  )
}
