'use client'

import { useState } from 'react'
import { Capacitor } from '@capacitor/core'

export function PrintButton({ clientName, quoteId }: { clientName: string; quoteId: string }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    const fileName = `quote-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`
    setDownloading(true)

    try {
      const fullUrl = `${window.location.origin}/api/export-pdf?id=${quoteId}`

      // Android: use native FileDownloader plugin (share sheet)
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        const { FileDownloader } = await import('@/lib/capacitor')
        await FileDownloader.download({ url: fullUrl, fileName })
        setDownloading(false)
        return
      }

      // iOS + Browser: fetch blob
      const response = await fetch(fullUrl)
      if (!response.ok) throw new Error('Failed')
      const blob = await response.blob()

      if (Capacitor.isNativePlatform()) {
        // iOS: use native share sheet
        const file = new File([blob], fileName, { type: 'application/pdf' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] })
        } else {
          const blobUrl = URL.createObjectURL(blob)
          window.open(blobUrl, '_blank')
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
        }
      } else {
        // Desktop browser: trigger download
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      }
    } catch {
      alert('Failed to download PDF. Please try again.')
    }
    setDownloading(false)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="btn-primary w-full flex items-center justify-center gap-2"
    >
      {downloading ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Save PDF
        </>
      )}
    </button>
  )
}
