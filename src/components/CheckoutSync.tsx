'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export function CheckoutSync() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('checkout') !== 'success') return

    // Sync subscription status with Stripe after checkout
    fetch('/api/stripe/verify', { method: 'POST' }).then(() => {
      // Remove query param from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('checkout')
      router.replace(url.pathname)
    })
  }, [searchParams, router])

  return null
}
