'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ArchiveButtonProps {
  requestId: string
  isArchived: boolean
}

export function ArchiveButton({ requestId, isArchived }: ArchiveButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleToggleArchive = async () => {
    setLoading(true)

    const newStatus = isArchived ? 'new' : 'archived'

    const { error } = await supabase
      .from('qs_quote_requests')
      .update({ status: newStatus })
      .eq('id', requestId)

    if (!error) {
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleToggleArchive}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 ${
        isArchived ? 'btn-secondary' : 'btn-ghost text-slate-400 hover:text-white'
      }`}
    >
      {loading ? (
        <span>...</span>
      ) : isArchived ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Restore from Archive
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Archive
        </>
      )}
    </button>
  )
}
