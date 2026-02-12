'use client'

import { useState, useEffect } from 'react'
import { CopyButton } from '@/components/CopyButton'

interface WhatsNextCardProps {
  userId: string
  requestFormUrl: string
}

export function WhatsNextCard({ userId, requestFormUrl }: WhatsNextCardProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const shouldShow = localStorage.getItem(`bq_show_whats_next_${userId}`) === 'true'
    const dismissed = localStorage.getItem(`bq_whats_next_dismissed_${userId}`) === 'true'
    setVisible(shouldShow && !dismissed)
  }, [userId])

  const dismiss = () => {
    localStorage.setItem(`bq_whats_next_dismissed_${userId}`, 'true')
    setVisible(false)
  }

  if (!visible) return null

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Hi! Please use this link to request a quote: ${requestFormUrl}`)}`
  const smsUrl = `sms:?body=${encodeURIComponent(`Hi! Please use this link to request a quote: ${requestFormUrl}`)}`

  return (
    <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">You&apos;re all set up!</h3>
            <p className="text-slate-400 text-sm">Here&apos;s what to do next</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-slate-500 hover:text-slate-300 p-1 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-5">
        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
          <div>
            <p className="text-white text-sm font-medium">Share your link with a client</p>
            <p className="text-slate-500 text-xs">They&apos;ll describe what they need and can send photos</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
          <div>
            <p className="text-white text-sm font-medium">Their request will appear right here</p>
            <p className="text-slate-500 text-xs">You&apos;ll get an email notification too</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
          <div>
            <p className="text-white text-sm font-medium">Create a quote with AI help</p>
            <p className="text-slate-500 text-xs">AI suggests line items and prices from your service list</p>
          </div>
        </div>
      </div>

      {/* Share section */}
      <div className="border-t border-green-500/20 pt-4">
        <p className="text-slate-400 text-xs mb-2">Your request link:</p>
        <div className="flex gap-2 mb-2">
          <input
            readOnly
            value={requestFormUrl}
            className="flex-1 bg-[#0a1628] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white text-sm"
          />
          <CopyButton text={requestFormUrl} />
        </div>
        <div className="flex gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          <a
            href={smsUrl}
            className="flex-1 flex items-center justify-center gap-2 bg-[#132039] hover:bg-[#1e3a5f] border border-[#1e3a5f] text-white text-sm font-medium py-2 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            SMS
          </a>
        </div>
      </div>
    </div>
  )
}
