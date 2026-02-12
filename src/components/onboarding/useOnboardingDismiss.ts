'use client'

import { useState, useEffect, useCallback } from 'react'

export function useOnboardingDismiss(key: string): [boolean, () => void] {
  const [dismissed, setDismissed] = useState(true) // default hidden to prevent flash

  useEffect(() => {
    setDismissed(localStorage.getItem(key) === 'true')
  }, [key])

  const dismiss = useCallback(() => {
    localStorage.setItem(key, 'true')
    setDismissed(true)
  }, [key])

  return [dismissed, dismiss]
}

export function useOnboardingToggle(key: string): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem(key) === 'true')
  }, [key])

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(key, String(next))
      return next
    })
  }, [key])

  return [collapsed, toggle]
}
