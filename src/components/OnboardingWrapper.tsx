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
    // Show onboarding if user has no services
    // Check localStorage to not show again if user dismissed it
    const dismissed = localStorage.getItem('onboarding_dismissed')
    if (servicesCount === 0 && !dismissed) {
      setShowOnboarding(true)
    }
  }, [servicesCount])

  const handleClose = () => {
    setShowOnboarding(false)
    localStorage.setItem('onboarding_dismissed', 'true')
  }

  if (!showOnboarding) return null

  return <OnboardingWizard onClose={handleClose} userId={userId} />
}
