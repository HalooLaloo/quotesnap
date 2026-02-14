'use client'

import { useEffect } from 'react'
import { initCapacitor } from '@/lib/capacitor'

export function CapacitorInit() {
  useEffect(() => {
    initCapacitor()

    // When the virtual keyboard opens on mobile, scroll the focused input into view.
    // Uses both focusin (with delay for keyboard animation) and visualViewport resize.
    const scrollFocusedInput = () => {
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }

    // On focus, wait for keyboard animation then scroll
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        setTimeout(scrollFocusedInput, 300)
        setTimeout(scrollFocusedInput, 600)
      }
    }

    // Also scroll on viewport resize (keyboard open/close)
    const vv = window.visualViewport
    const onResize = () => {
      requestAnimationFrame(scrollFocusedInput)
    }

    document.addEventListener('focusin', onFocusIn)
    vv?.addEventListener('resize', onResize)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      vv?.removeEventListener('resize', onResize)
    }
  }, [])

  return null
}
