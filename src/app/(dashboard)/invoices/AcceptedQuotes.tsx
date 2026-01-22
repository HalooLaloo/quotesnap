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
  } | null
}

interface AcceptedQuotesProps {
  quotes: Quote[]
}

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

export function AcceptedQuotes({ quotes }: AcceptedQuotesProps) {
  const [search, setSearch] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  const filteredQuotes = quotes.filter(quote => {
    if (!search.trim()) return true
    const clientName = quote.qs_quote_requests?.client_name || ''
    const clientEmail = quote.qs_quote_requests?.client_email || ''
    const searchLower = search.toLowerCase()
    return clientName.toLowerCase().includes(searchLower) ||
           clientEmail.toLowerCase().includes(searchLower)
  })

  if (quotes.length === 0) {
    return null
  }

  return (
    <div className="card mb-8">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Accepted Quotes ({quotes.length})
            </h2>
            <p className="text-slate-400 text-sm">
              Create invoices from quotes your clients accepted
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="mt-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by client name or email..."
                className="input pl-10"
              />
            </div>
          </div>

          {/* Quotes list */}
          {filteredQuotes.length > 0 ? (
            <div className="space-y-3">
              {filteredQuotes.map((quote) => {
                const currencySymbol = getCurrencySymbol(quote.currency || 'PLN')
                const total = quote.total_gross || quote.total || 0

                return (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-4 bg-green-600/5 border border-green-500/20 rounded-lg hover:bg-green-600/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">
                        {quote.qs_quote_requests?.client_name || 'Unknown Client'}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {quote.qs_quote_requests?.client_email && (
                          <span>{quote.qs_quote_requests.client_email} • </span>
                        )}
                        <span className="text-green-400 font-medium">
                          {currencySymbol}{total.toFixed(2)}
                        </span>
                        <span className="text-slate-500"> • </span>
                        <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        View Quote
                      </Link>
                      <Link
                        href={`/invoices/new?from_quote=${quote.id}`}
                        className="btn-primary text-sm"
                      >
                        Create Invoice
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              {search ? (
                <p>No quotes found matching "{search}"</p>
              ) : (
                <p>No accepted quotes yet</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
