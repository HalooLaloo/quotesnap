'use client'

import { useOnboardingDismiss } from './useOnboardingDismiss'

interface PageGuideCardProps {
  pageKey: string
  userId: string
  icon: React.ReactNode
  title: string
  description: string
}

export function PageGuideCard({ pageKey, userId, icon, title, description }: PageGuideCardProps) {
  const [dismissed, dismiss] = useOnboardingDismiss(`bq_guide_dismissed_${pageKey}_${userId}`)

  if (dismissed) return null

  return (
    <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-4">
      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium mb-1">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
      <button
        onClick={dismiss}
        className="text-slate-500 hover:text-slate-300 shrink-0 p-1 transition"
        title="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
