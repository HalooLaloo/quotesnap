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

  const filterTabs: { key: StatusFilter; label: string; bg: string; active: string }[] = [
    { key: 'all', label: 'All', bg: 'bg-slate-700/50 text-slate-300', active: 'bg-blue-600 text-white' },
    { key: 'sent', label: 'Sent', bg: 'bg-slate-700/50 text-blue-400', active: 'bg-blue-600 text-white' },
    { key: 'viewed', label: 'Viewed', bg: 'bg-slate-700/50 text-purple-400', active: 'bg-purple-600 text-white' },
    { key: 'accepted', label: 'Accepted', bg: 'bg-slate-700/50 text-green-400', active: 'bg-green-600 text-white' },
    { key: 'rejected', label: 'Rejected', bg: 'bg-slate-700/50 text-red-400', active: 'bg-red-600 text-white' },
    { key: 'expired', label: 'Expired', bg: 'bg-slate-700/50 text-orange-400', active: 'bg-orange-600 text-white' },
    { key: 'draft', label: 'Drafts', bg: 'bg-slate-700/50 text-slate-400', active: 'bg-slate-600 text-white' },
  ]

  return (
    <div>
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
            placeholder="Search quotes..."
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
        {filterTabs.map(tab => {
          const isActive = statusFilter === tab.key
          const count = statusCounts[tab.key]
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-full transition-colors ${
                isActive ? tab.active : tab.bg + ' hover:opacity-80'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1 opacity-75">{count}</span>
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

            // Extract work type from description
            const desc = quote.qs_quote_requests?.description || ''
            const workTypeMatch = desc.match(/(?:TYPE OF WORK|RODZAJ PRAC):\s*([^\n]+)/i)
            const workType = workTypeMatch ? workTypeMatch[1].trim() : ''

            const effectiveStatus = expired ? 'expired' : viewed ? 'viewed' : quote.status

            const cardBorders: Record<string, string> = {
              sent: 'border-l-blue-500',
              viewed: 'border-l-purple-500',
              accepted: 'border-l-green-500',
              rejected: 'border-l-red-500',
              expired: 'border-l-orange-500',
              draft: 'border-l-slate-500',
            }

            return (
              <Link
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className={`block p-4 rounded-lg border-l-4 bg-slate-700/30 hover:bg-slate-700/60 transition-colors ${
                  cardBorders[effectiveStatus] || 'border-l-slate-500'
                }`}
              >
                {/* Row 1: Name + Amount */}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold">{clientName}</p>
                      <span className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full ${
                        statusColors[effectiveStatus] || statusColors.draft
                      }`}>
                        {effectiveStatus}
                      </span>
                      {viewed && !expired && (
                        <span title={`Viewed ${new Date(quote.viewed_at!).toLocaleString('en-US')}`}>
                          <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    {workType && (
                      <p className="text-slate-400 text-sm mt-0.5">{workType}</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-lg font-bold ${
                    quote.status === 'accepted' ? 'text-green-400' :
                    quote.status === 'rejected' ? 'text-red-400' :
                    'text-white'
                  }`}>
                    {currencySymbol}{total.toFixed(2)}
                  </span>
                </div>

                {/* Row 2: Date + Valid until + Delete */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/30">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{new Date(quote.created_at).toLocaleDateString('en-US')}</span>
                    {quote.valid_until && (
                      <span className={expired ? 'text-orange-400' : ''}>
                        Valid until {new Date(quote.valid_until).toLocaleDateString('en-US')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDeleteModal(quote)
                    }}
                    className="p-1 text-slate-600 hover:text-red-400 rounded transition-colors"
                    title="Delete quote"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Link>
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
