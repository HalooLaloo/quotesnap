'use client'

import { useState } from 'react'

export function PrintButton({ clientName, quoteId }: { clientName: string; quoteId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const fileName = `quote-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`

  const handleSave = async () => {
    setStatus('loading')
    setErrorMsg('')

    try {
      // 1. Fetch PDF from API
      const res = await fetch(`/api/export-pdf?id=${quoteId}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const blob = await res.blob()
      const file = new File([blob], fileName, { type: 'application/pdf' })

      // 2. Try Web Share API with file (native Android share dialog)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Quote - ${clientName}`,
        })
        setStatus('idle')
        return
      }

      // 3. Fallback: try creating object URL and opening it
      const url = URL.createObjectURL(blob)
      window.location.href = url
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      setStatus('idle')
    } catch (err) {
      // Share cancelled by user is not an error
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('idle')
        return
      }
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div>
      <button
        onClick={handleSave}
        disabled={status === 'loading'}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {status === 'loading' ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share / Save PDF
          </>
        )}
      </button>

      {status === 'error' && (
        <p className="text-red-400 text-xs mt-2 text-center">{errorMsg}</p>
      )}
    </div>
  )
}
