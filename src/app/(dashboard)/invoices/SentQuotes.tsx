'use client'

import { useState } from 'react'
import Link from 'next/link'
import { COUNTRIES } from '@/lib/countries'

interface Quote {
  id: string
  total_gross: number
  total: number
  status: string
  created_at: string
  currency?: string
  qs_quote_requests: {
    client_name: string
    client_email?: string
  } | {
    client_name: string
    client_email?: string
  }[] | null
}

interface SentQuotesProps {
  quotes: Quote[]
}

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

export function SentQuotes({ quotes }: SentQuotesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getClientData = (quote: Quote) => {
    const req = quote.qs_quote_requests
    if (!req) return { name: '', email: '' }
    if (Array.isArray(req)) {
      return { name: req[0]?.client_name || '', email: req[0]?.client_email || '' }
    }
    return { name: req.client_name || '', email: req.client_email || '' }
  }

  if (quotes.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-2"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Other quotes ({quotes.length})
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {quotes.map((quote) => {
            const currencySymbol = getCurrencySymbol(quote.currency || 'USD')
            const total = quote.total_gross || quote.total || 0
            const client = getClientData(quote)

            return (
              <div
                key={quote.id}
                className="p-3 border-l-4 border-l-blue-500 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium">
                      {client.name || 'Unknown Client'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {currencySymbol}{total.toFixed(2)}
                    </p>
                  </div>
                  <Link
                    href={`/invoices/new?from_quote=${quote.id}`}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-white border border-blue-500/30 hover:bg-blue-600 rounded-lg transition-colors"
                  >
                    Create Invoice
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
