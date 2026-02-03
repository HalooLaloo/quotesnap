'use client'

import { useState, useEffect } from 'react'
import { OnboardingWizard } from './OnboardingWizard'

interface OnboardingWrapperProps {
  servicesCount: number
  userId: string
}

export function OnboardingWrapper({ servicesCount, userId }: OnboardingWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)

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
    localStorage.setItem(`onboarding_dismissed_${userId}`, 'true')
  }

  // Don't render until we've checked localStorage (null = not yet checked)
  if (showOnboarding !== true) return null

  return <OnboardingWizard onClose={handleClose} userId={userId} />
}
