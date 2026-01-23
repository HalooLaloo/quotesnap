'use client'

import { useState, useEffect } from 'react'
import { OnboardingWizard } from './OnboardingWizard'

interface OnboardingWrapperProps {
  servicesCount: number
  userId: string
}

export function OnboardingWrapper({ servicesCount, userId }: OnboardingWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const dismissed = localStorage.getItem(`onboarding_dismissed_${userId}`)

    // If user already dismissed or has services, don't show onboarding
    if (dismissed || servicesCount > 0) {
      setShowOnboarding(false)
      return
    }

    // New user without services - show onboarding
    setShowOnboarding(true)
  }, [servicesCount, userId])

  const handleClose = () => {
    setShowOnboarding(false)
    localStorage.setItem(`onboarding_dismissed_${userId}`, 'true')
  }

  // Don't render until mounted (prevents hydration issues)
  if (!mounted || !showOnboarding) return null

  return <OnboardingWizard onClose={handleClose} userId={userId} />
}
