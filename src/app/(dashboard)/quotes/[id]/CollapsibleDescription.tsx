'use client'

import { useState } from 'react'

interface CollapsibleDescriptionProps {
  description: string
}

export function CollapsibleDescription({ description }: CollapsibleDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Wyciągnij podsumowanie (przed ---ROZMOWA---)
  const summaryMatch = description.match(/^([\s\S]*?)(?=---ROZMOWA---|$)/)
  const summary = summaryMatch ? summaryMatch[1].trim() : ''

  // Wyciągnij rozmowę (po ---ROZMOWA---)
  const conversationMatch = description.match(/---ROZMOWA---([\s\S]*)$/)
  const conversation = conversationMatch ? conversationMatch[1].trim() : ''

  return (
    <div className="space-y-4">
      {/* Podsumowanie - zawsze widoczne */}
      {summary && (
        <div className="text-slate-300 whitespace-pre-wrap text-sm">
          {summary}
        </div>
      )}

      {/* Rozmowa - zwijana */}
      {conversation && (
        <div className="border-t border-slate-700 pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {isExpanded ? 'Zwiń rozmowę' : 'Pokaż rozmowę z klientem'}
          </button>

          {isExpanded && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
              <p className="text-slate-300 whitespace-pre-wrap text-sm">
                {conversation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Jeśli nie ma struktury z rozmową, pokaż całość */}
      {!summary && !conversation && (
        <p className="text-slate-300 whitespace-pre-wrap text-sm">
          {description}
        </p>
      )}
    </div>
  )
}
