'use client'

import { useState, useEffect } from 'react'
import { OnboardingModal } from './OnboardingModal'

interface OnboardingWrapperProps {
  servicesCount: number
}

export function OnboardingWrapper({ servicesCount }: OnboardingWrapperProps) {
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

  return <OnboardingModal onClose={handleClose} />
}
