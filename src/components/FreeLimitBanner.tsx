'use client'

export function FreeLimitBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="text-amber-300 text-sm font-medium">{message}</p>
          <p className="text-slate-400 text-xs mt-1">
            Upgrade to Pro for unlimited access to all features.
          </p>
        </div>
      </div>
    </div>
  )
}
