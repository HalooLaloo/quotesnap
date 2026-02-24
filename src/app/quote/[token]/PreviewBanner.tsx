'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export function PreviewBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  if (searchParams.get('preview') !== '1') return null

  return (
    <div className="bg-amber-600 text-white px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="font-medium text-sm">Preview — this is what your client will see</span>
      </div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Go Back
      </button>
    </div>
  )
}
