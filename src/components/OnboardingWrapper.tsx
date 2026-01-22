'use client'

import { useState, useEffect } from 'react'
import { OnboardingWizard } from './OnboardingWizard'

interface OnboardingWrapperProps {
  servicesCount: number
  userId: string
  hasCountry: boolean
}

export function OnboardingWrapper({ servicesCount, userId, hasCountry }: OnboardingWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Show onboarding if:
    // 1. User has no services AND no country set (new user)
    // 2. User has no services AND hasn't dismissed onboarding
    const dismissed = localStorage.getItem(`onboarding_dismissed_${userId}`)

    // New user without country setup - always show
    if (!hasCountry) {
      setShowOnboarding(true)
      return
    }

    // User completed country but has no services and didn't dismiss
    if (servicesCount === 0 && !dismissed) {
      setShowOnboarding(true)
    }
  }, [servicesCount, hasCountry, userId])

  const handleClose = () => {
    setShowOnboarding(false)
    // Use user-specific key so different accounts don't share dismissed state
    localStorage.setItem(`onboarding_dismissed_${userId}`, 'true')
  }

  if (!showOnboarding) return null

  return <OnboardingWizard onClose={handleClose} userId={userId} />
}
