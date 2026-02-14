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
    <div className="card p-3 md:p-6 mb-6">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-white">
              Sent Quotes ({quotes.length})
            </h2>
            <p className="text-slate-400 text-xs md:text-sm">
              Client confirmed verbally? Create an invoice
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {quotes.map((quote) => {
            const currencySymbol = getCurrencySymbol(quote.currency || 'USD')
            const total = quote.total_gross || quote.total || 0
            const client = getClientData(quote)

            return (
              <div
                key={quote.id}
                className="p-4 border-l-4 border-l-blue-500 bg-slate-700/30 rounded-lg"
              >
                {/* Row 1: Name + Amount */}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <p className="text-white font-semibold">
                      {client.name || 'Unknown Client'}
                    </p>
                    {client.email && (
                      <p className="text-slate-400 text-sm mt-0.5">{client.email}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-lg font-bold text-blue-400">
                    {currencySymbol}{total.toFixed(2)}
                  </span>
                </div>

                {/* Row 2: Date + Actions */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/30">
                  <span className="text-xs text-slate-500">
                    {new Date(quote.created_at).toLocaleDateString('en-US')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      href={`/invoices/new?from_quote=${quote.id}`}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Create Invoice
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
