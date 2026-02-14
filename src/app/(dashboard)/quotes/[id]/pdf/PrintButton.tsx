'use client'

import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { FileDownloader } from '@/lib/capacitor'

export function PrintButton({ clientName, quoteId }: { clientName: string; quoteId: string }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    const fileName = `quote-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`

    // Native Android: use DownloadManager via native plugin
    if (Capacitor.isNativePlatform()) {
      try {
        const fullUrl = `${window.location.origin}/api/export-pdf?id=${quoteId}`
        await FileDownloader.download({ url: fullUrl, fileName })
      } catch (err: any) {
        alert('Debug: ' + (err?.message || err?.errorMessage || JSON.stringify(err)))
      }
      return
    }

    // Desktop: fetch blob and trigger download
    setDownloading(true)
    try {
      const response = await fetch(`/api/export-pdf?id=${quoteId}`)
      if (!response.ok) throw new Error('Failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      alert('Failed to download PDF.')
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
