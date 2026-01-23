'use client'

import { useEffect } from 'react'

interface TrackQuoteViewProps {
  token: string
  status: string
}

export function TrackQuoteView({ token, status }: TrackQuoteViewProps) {
  useEffect(() => {
    // Only track views for sent quotes
    if (status !== 'sent') return

    const trackView = async () => {
      try {
        await fetch('/api/track-quote-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })
      } catch (error) {
        // Silently fail - tracking is not critical
        console.error('Failed to track quote view:', error)
      }
    }

    trackView()
  }, [token, status])

  // This component doesn't render anything
  return null
}
