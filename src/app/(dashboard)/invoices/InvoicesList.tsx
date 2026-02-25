'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { COUNTRIES } from '@/lib/countries'

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_email: string | null
  total_gross: number
  currency: string | null
  status: string
  created_at: string
  due_date: string | null
  sent_at: string | null
  paid_at: string | null
}

interface InvoicesListProps {
  invoices: Invoice[]
}

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

type StatusFilter = 'all' | 'draft' | 'sent' | 'paid' | 'overdue'

export function InvoicesList({ invoices }: InvoicesListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deleteModal, setDeleteModal] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: deleteModal.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      setDeleteModal(null)
      router.refresh()
    } catch (err) {
      console.error('Error deleting invoice:', err)
      alert('Failed to delete invoice')
    } finally {
      setDeleting(false)
    }
  }

  // Check if invoice is overdue
  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'paid') return false
    if (!invoice.due_date) return false
    return new Date(invoice.due_date) < new Date()
  }

  // Calculate stats
  const stats = useMemo(() => {
    let totalPending = 0
    let totalPaid = 0
    let overdueCount = 0
    let overdueAmount = 0

    invoices.forEach(inv => {
      const amount = inv.total_gross || 0
      if (inv.status === 'paid') {
        totalPaid += amount
      } else {
        totalPending += amount
        if (isOverdue(inv)) {
          overdueCount++
          overdueAmount += amount
        }
      }
    })

    return { totalPending, totalPaid, overdueCount, overdueAmount }
  }, [invoices])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      if (search.trim()) {
        const searchLower = search.toLowerCase()
        const matchesName = invoice.client_name?.toLowerCase().includes(searchLower)
        const matchesNumber = invoice.invoice_number?.toLowerCase().includes(searchLower)
        const matchesEmail = invoice.client_email?.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesNumber && !matchesEmail) return false
      }

      if (statusFilter === 'overdue') {
        return isOverdue(invoice)
      }
      if (statusFilter !== 'all' && invoice.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [invoices, search, statusFilter])

  // Count by status
  const statusCounts = useMemo(() => {
    const counts = { all: invoices.length, draft: 0, sent: 0, paid: 0, overdue: 0 }
    invoices.forEach(inv => {
      if (inv.status === 'draft') counts.draft++
      if (inv.status === 'sent') counts.sent++
      if (inv.status === 'paid') counts.paid++
      if (isOverdue(inv)) counts.overdue++
    })
    return counts
  }, [invoices])

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-400',
    sent: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
    overdue: 'bg-red-500/20 text-red-400',
  }

  const filterTabs: { key: StatusFilter; label: string; bg: string; active: string }[] = [
    { key: 'all', label: 'All', bg: 'bg-slate-700/50 text-slate-300', active: 'bg-blue-600 text-white' },
    { key: 'sent', label: 'Sent', bg: 'bg-slate-700/50 text-blue-400', active: 'bg-blue-600 text-white' },
    { key: 'paid', label: 'Paid', bg: 'bg-slate-700/50 text-green-400', active: 'bg-green-600 text-white' },
    { key: 'overdue', label: 'Overdue', bg: 'bg-slate-700/50 text-red-400', active: 'bg-red-600 text-white' },
    { key: 'draft', label: 'Drafts', bg: 'bg-slate-700/50 text-slate-400', active: 'bg-slate-600 text-white' },
  ]

  const cardStyles: Record<string, string> = {
    sent: 'border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10',
    paid: 'border-l-green-500 bg-green-500/5 hover:bg-green-500/10',
    overdue: 'border-l-red-500 bg-red-500/5 hover:bg-red-500/10',
    draft: 'border-l-slate-500 bg-slate-700/30 hover:bg-slate-700/60',
  }

  const cs = getCurrencySymbol(invoices[0]?.currency || 'USD')

  return (
    <div className="card p-3 md:p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-3 md:p-4">
          <p className="text-slate-400 text-xs md:text-sm">Pending</p>
          <p className="text-lg md:text-xl font-bold text-white">
            {cs}{stats.totalPending.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 md:p-4">
          <p className="text-slate-400 text-xs md:text-sm">Paid</p>
          <p className="text-lg md:text-xl font-bold text-green-400">
            {cs}{stats.totalPaid.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 md:p-4">
          <p className="text-slate-400 text-xs md:text-sm">Overdue</p>
          <p className="text-lg md:text-xl font-bold text-red-400">
            {stats.overdueCount}
            {stats.overdueAmount > 0 && (
              <span className="text-sm font-normal ml-1">({cs}{stats.overdueAmount.toFixed(2)})</span>
            )}
          </p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 md:p-4">
          <p className="text-slate-400 text-xs md:text-sm">Total</p>
          <p className="text-lg md:text-xl font-bold text-white">{invoices.length}</p>
        </div>
      </div>

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
            placeholder="Search invoices..."
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

      {/* Invoice List */}
      {filteredInvoices.length > 0 ? (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const overdue = isOverdue(invoice)
            const currencySymbol = getCurrencySymbol(invoice.currency || 'USD')
            const effectiveStatus = overdue ? 'overdue' : invoice.status

            return (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className={`block p-4 rounded-lg border-l-4 transition-colors ${
                  cardStyles[effectiveStatus] || cardStyles.draft
                }`}
              >
                {/* Row 1: Name + Badge + Amount */}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold">{invoice.client_name || 'No name'}</p>
                      <span className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full ${
                        statusColors[effectiveStatus] || statusColors.draft
                      }`}>
                        {effectiveStatus}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-0.5">{invoice.invoice_number}</p>
                  </div>
                  <span className={`shrink-0 text-lg font-bold ${
                    invoice.status === 'paid' ? 'text-green-400' :
                    overdue ? 'text-red-400' :
                    'text-white'
                  }`}>
                    {currencySymbol}{invoice.total_gross?.toFixed(2) || '0.00'}
                  </span>
                </div>

                {/* Row 2: Date + Due date + Delete */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/30">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{new Date(invoice.created_at).toLocaleDateString('en-US')}</span>
                    {invoice.due_date && (
                      <span className={overdue ? 'text-red-400' : ''}>
                        Due {new Date(invoice.due_date).toLocaleDateString('en-US')}
                      </span>
                    )}
                    {invoice.paid_at && (
                      <span className="text-green-400">
                        Paid {new Date(invoice.paid_at).toLocaleDateString('en-US')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDeleteModal(invoice)
                    }}
                    className="p-1 text-slate-600 hover:text-red-400 rounded transition-colors"
                    title="Delete invoice"
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
                No invoices found for the given criteria.
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">No invoices</h3>
              <p className="text-slate-400 mb-4">Create your first invoice from an accepted quote or from scratch.</p>
              <Link href="/invoices/new" className="btn-primary">
                Create invoice
              </Link>
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
                <h3 className="text-lg font-semibold text-white">Delete invoice</h3>
                <p className="text-slate-400 text-sm">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-slate-300 mb-6">
              Are you sure you want to delete invoice <span className="font-semibold text-white">{deleteModal.invoice_number}</span> for <span className="font-semibold text-white">{deleteModal.client_name}</span>?
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
                  'Delete invoice'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
