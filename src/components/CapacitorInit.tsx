'use client'

import { useEffect } from 'react'
import { initCapacitor } from '@/lib/capacitor'

export function CapacitorInit() {
  useEffect(() => {
    initCapacitor()

    const vv = window.visualViewport
    if (!vv) return

    // Set --app-height CSS variable based on visualViewport
    // This accounts for the virtual keyboard on mobile
    const updateHeight = () => {
      const height = vv.height
      document.documentElement.style.setProperty('--app-height', `${height}px`)
    }

    // Initial set
    updateHeight()

    // Update on viewport resize only (keyboard open/close)
    // Do NOT listen to 'scroll' — it causes feedback loops with scrollIntoView
    vv.addEventListener('resize', updateHeight)

    // When an input/textarea is focused, scroll it into view after keyboard animation
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        setTimeout(() => {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }, 300)
      }
    }

    document.addEventListener('focusin', onFocusIn)

    return () => {
      vv.removeEventListener('resize', updateHeight)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [])

  return null
}
