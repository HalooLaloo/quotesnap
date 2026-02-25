'use client'

import { useState } from 'react'
import { nativeShare, hapticImpact, hapticNotification, isNative } from '@/lib/capacitor'

interface ShareLinkButtonProps {
  url: string
  variant?: 'default' | 'primary'
}

export function ShareLinkButton({ url, variant = 'default' }: ShareLinkButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    hapticNotification('success')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (isNative()) {
      hapticImpact('light')
      const shared = await nativeShare({
        title: 'Request a Quote',
        text: 'Request a quote with photos:',
        url,
      })
      if (shared) return
    }
    setShowModal(true)
  }

  return (
    <>
      <button
        onClick={handleShare}
        className={variant === 'primary'
          ? 'btn-primary inline-flex items-center gap-2 text-sm'
          : 'flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-xs font-medium'
        }
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>Share</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Share Link</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-4">
              Send this link to clients - they can submit quote requests with photos.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={url}
                className="input flex-1 text-sm"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Request a quote: ' + url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
              <a
                href={`sms:?body=${encodeURIComponent('Request a quote: ' + url)}`}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                SMS
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
