'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DownloadPDFButton } from '@/components/DownloadPDFButton'

interface QuoteActionsProps {
  quote: {
    id: string
    status: string
    token: string
    request_id: string | null
  }
  clientEmail: string | null
}

export function QuoteActions({ quote, clientEmail }: QuoteActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showMessage, setShowMessage] = useState(false)
  const [personalMessage, setPersonalMessage] = useState('')
  const [pdfKey, setPdfKey] = useState(0)
  const router = useRouter()

  const pdfUrl = `/api/quote-pdf/${quote.token}`

  const handleSendToClient = async () => {
    if (!clientEmail) {
      alert('No client email address')
      return
    }

    setLoading('sending')
    try {
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.id,
          ...(personalMessage.trim() && { personalMessage: personalMessage.trim() }),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send')
      }

      router.refresh()
    } catch (err) {
      console.error('Error sending quote:', err)
      alert('Failed to send quote')
    } finally {
      setLoading(null)
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/quote/${quote.token}`
    await navigator.clipboard.writeText(url)
    alert('Quote link copied!')
  }

  if (quote.status !== 'draft') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* PDF Preview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">PDF Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPdfKey(k => k + 1)}
              className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <DownloadPDFButton
              url={pdfUrl}
              fileName={`quote-${quote.id}.pdf`}
              className="btn-secondary text-sm inline-flex items-center gap-2"
            />
          </div>
        </div>
        <div className="bg-white rounded-lg overflow-hidden" style={{ height: '500px' }}>
          <iframe
            key={pdfKey}
            src={`${pdfUrl}#toolbar=0`}
            className="w-full h-full"
            title="Quote PDF Preview"
          />
        </div>
      </div>

      {/* Send Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Send to Client</h2>
        <div className="space-y-3">
          {clientEmail && (
            <>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowMessage(!showMessage)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="text-sm text-white">Personal Message</span>
                    <span className="text-slate-500 text-xs">(optional)</span>
                    <svg className={`w-3 h-3 text-slate-400 ml-auto transition-transform ${showMessage ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {showMessage && (
                  <textarea
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    className="input min-h-[70px] resize-y text-sm"
                    placeholder="Add a personal note to the email..."
                  />
                )}
                <button
                  onClick={handleSendToClient}
                  disabled={loading === 'sending'}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading === 'sending' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send to Client
                    </>
                  )}
                </button>
              </div>
            </>
          )}
          <button
            onClick={handleCopyLink}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Quote Link
          </button>
        </div>
      </div>
    </div>
  )
}
