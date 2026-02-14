'use client'

import { useState } from 'react'

interface DownloadPDFButtonProps {
  url: string
  fileName: string
  className?: string
  label?: string
}

export function DownloadPDFButton({ url, fileName, className = 'btn-secondary flex items-center gap-2', label = 'Download PDF' }: DownloadPDFButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const file = new File([blob], fileName, { type: 'application/pdf' })

      // Mobile: use Web Share API (shows share sheet — save, email, WhatsApp, etc.)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName })
      } else {
        // Desktop: download via <a download>
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
      }
    } catch (error) {
      console.error('PDF download error:', error)
      alert('Failed to download PDF. Please try again.')
    }
    setDownloading(false)
  }

  return (
    <button onClick={handleDownload} disabled={downloading} className={className}>
      {downloading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}
