'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { COUNTRIES } from '@/lib/countries'

interface Quote {
  id: string
  total: number
  total_gross: number | null
  currency: string | null
  status: string
  created_at: string
  valid_until: string | null
  viewed_at: string | null
  qs_quote_requests: {
    client_name: string
    client_email: string | null
    description: string | null
  } | null
}

interface QuotesListProps {
  quotes: Quote[]
}

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

type StatusFilter = 'all' | 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'

export function QuotesList({ quotes }: QuotesListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deleteModal, setDeleteModal] = useState<Quote | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('qs_quotes')
        .delete()
        .eq('id', deleteModal.id)

      if (error) throw error
      setDeleteModal(null)
      router.refresh()
    } catch (err) {
      console.error('Error deleting quote:', err)
      alert('Failed to delete quote')
    } finally {
      setDeleting(false)
    }
  }

  // Check if quote is expired
  const isExpired = (quote: Quote) => {
    if (quote.status === 'accepted' || quote.status === 'rejected') return false
    if (!quote.valid_until) return false
    return new Date(quote.valid_until) < new Date()
  }

  // Check if quote was viewed
  const isViewed = (quote: Quote) => {
    return quote.status === 'sent' && quote.viewed_at
  }

  // Filter quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      // Search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase()
        const matchesName = quote.qs_quote_requests?.client_name?.toLowerCase().includes(searchLower)
        const matchesEmail = quote.qs_quote_requests?.client_email?.toLowerCase().includes(searchLower)
        const matchesDesc = quote.qs_quote_requests?.description?.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesEmail && !matchesDesc) return false
      }

      // Status filter
      if (statusFilter === 'expired') {
        return quote.status === 'expired' || isExpired(quote)
      }
      if (statusFilter === 'viewed') {
        return isViewed(quote)
      }
      if (statusFilter !== 'all' && quote.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [quotes, search, statusFilter])

  // Count by status
  const statusCounts = useMemo(() => {
    const counts = { all: quotes.length, draft: 0, sent: 0, viewed: 0, accepted: 0, rejected: 0, expired: 0 }
    quotes.forEach(q => {
      if (q.status === 'draft') counts.draft++
      if (q.status === 'sent') counts.sent++
      if (isViewed(q)) counts.viewed++
      if (q.status === 'accepted') counts.accepted++
      if (q.status === 'rejected') counts.rejected++
      if (q.status === 'expired' || isExpired(q)) counts.expired++
    })
    return counts
  }, [quotes])

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-400',
    sent: 'bg-blue-500/20 text-blue-400',
    viewed: 'bg-purple-500/20 text-purple-400',
    accepted: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    expired: 'bg-orange-500/20 text-orange-400',
  }

  const filterTabs: { key: StatusFilter; label: string; color?: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts' },
    { key: 'sent', label: 'Sent' },
    { key: 'viewed', label: 'Viewed', color: 'text-purple-400' },
    { key: 'accepted', label: 'Accepted', color: 'text-green-400' },
    { key: 'rejected', label: 'Rejected', color: 'text-red-400' },
    { key: 'expired', label: 'Expired', color: 'text-orange-400' },
  ]

  return (
    <div className="card">
      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
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
            placeholder="Search by client or description..."
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-700 overflow-x-auto pb-px -mx-1 px-1">
        {filterTabs.map(tab => {
          const isActive = statusFilter === tab.key
          const count = statusCounts[tab.key]
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`relative px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-blue-600/30 text-blue-300'
                    : 'bg-slate-700 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Quote List */}
      {filteredQuotes.length > 0 ? (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => {
            const expired = quote.status === 'expired' || isExpired(quote)
            const viewed = isViewed(quote)
            const currencySymbol = getCurrencySymbol(quote.currency || 'USD')
            const total = quote.total_gross || quote.total || 0
            const clientName = quote.qs_quote_requests?.client_name || 'No name'

            return (
              <div
                key={quote.id}
                className={`p-4 rounded-lg transition-colors ${
                  expired
                    ? 'bg-orange-500/10 border border-orange-500/30'
                    : quote.status === 'accepted'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : quote.status === 'rejected'
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-slate-700/50'
                }`}
              >
                <Link href={`/quotes/${quote.id}`} className="block hover:opacity-90 transition-opacity">
                  {/* Row 1: Name + Status + Amount */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-white font-medium truncate">{clientName}</p>
                      <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${
                        expired ? statusColors.expired :
                        viewed ? statusColors.viewed :
                        statusColors[quote.status] || statusColors.draft
                      }`}>
                        {expired ? 'expired' : viewed ? 'viewed' : quote.status}
                      </span>
                      {viewed && !expired && (
                        <span title={`Viewed ${new Date(quote.viewed_at!).toLocaleString('en-US')}`}>
                          <svg className="w-3.5 h-3.5 shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 text-lg font-semibold ${
                      quote.status === 'accepted' ? 'text-green-400' :
                      quote.status === 'rejected' ? 'text-red-400' :
                      'text-white'
                    }`}>
                      {currencySymbol}{total.toFixed(2)}
                    </span>
                  </div>

                  {/* Row 2: Email + Date */}
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-400 truncate">
                      {quote.qs_quote_requests?.client_email || 'No email'}
                    </span>
                    <span className="text-slate-500 shrink-0">
                      {new Date(quote.created_at).toLocaleDateString('en-US')}
                    </span>
                  </div>

                  {/* Row 3: Valid until (if present) */}
                  {quote.valid_until && (
                    <div className="flex items-center justify-between mt-1">
                      <span />
                      <span className={`text-xs ${expired ? 'text-orange-400' : 'text-slate-600'}`}>
                        Valid until {new Date(quote.valid_until).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  )}
                </Link>

                {/* Delete button - separate from link */}
                <div className="flex justify-end mt-2 pt-2 border-t border-slate-700/50">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDeleteModal(quote)
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs flex items-center gap-1"
                    title="Delete quote"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          {search || statusFilter !== 'all' ? (
            <>
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">No results</h3>
              <p className="text-slate-400">
                No quotes found for the given criteria.
              </p>
              <button
                onClick={() => { setSearch(''); setStatusFilter('all') }}
                className="text-blue-400 hover:text-blue-300 mt-2"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">No quotes</h3>
              <p className="text-slate-400">Quotes will appear here after creating them from client requests.</p>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete quote</h3>
                <p className="text-slate-400 text-sm">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-slate-300 mb-6">
              Are you sure you want to delete the quote for <span className="font-semibold text-white">{deleteModal.qs_quote_requests?.client_name || 'Unknown'}</span>?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete quote'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
