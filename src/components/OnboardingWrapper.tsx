'use client'

import { useState, useEffect } from 'react'
import { OnboardingWizard } from './OnboardingWizard'

interface OnboardingWrapperProps {
  servicesCount: number
  userId: string
}

export function OnboardingWrapper({ servicesCount, userId }: OnboardingWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
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
    // Use user-specific key so different accounts don't share dismissed state
    localStorage.setItem(`onboarding_dismissed_${userId}`, 'true')
  }

  if (!showOnboarding) return null

  return <OnboardingWizard onClose={handleClose} userId={userId} />
}
