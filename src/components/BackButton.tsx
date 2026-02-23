'use client'

export function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  )
}
