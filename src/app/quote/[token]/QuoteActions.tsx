'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuoteActionsProps {
  token: string
}

export function QuoteActions({ token }: QuoteActionsProps) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleAction = async (action: 'accept' | 'reject') => {
    setLoading(action)
    setError('')

    try {
      const response = await fetch('/api/accept-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Wystąpił błąd serwera. Spróbuj ponownie.')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Nie udało się przetworzyć')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coś poszło nie tak')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="card">
      <h3 className="font-medium text-white mb-4 text-center">Twoja decyzja</h3>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => handleAction('reject')}
          disabled={loading !== null}
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          {loading === 'reject' ? (
            <span className="animate-spin">...</span>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Odrzuć
            </>
          )}
        </button>

        <button
          onClick={() => handleAction('accept')}
          disabled={loading !== null}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {loading === 'accept' ? (
            <span className="animate-spin">...</span>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Akceptuję wycenę
            </>
          )}
        </button>
      </div>

      <p className="text-slate-500 text-xs text-center mt-4">
        Akceptując, wyrażasz zgodę na realizację prac. Wykonawca zostanie powiadomiony.
      </p>
    </div>
  )
}
