'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Invoice {
  id: string
  status: string
  client_email: string | null
  token: string
}

interface InvoiceActionsProps {
  invoice: Invoice
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleMarkAsSent = async () => {
    setLoading('sent')
    try {
      const { error } = await supabase
        .from('qs_invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Error marking as sent:', err)
      alert('Failed to update invoice')
    } finally {
      setLoading(null)
    }
  }

  const handleMarkAsPaid = async () => {
    setLoading('paid')
    try {
      const { error } = await supabase
        .from('qs_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Error marking as paid:', err)
      alert('Failed to update invoice')
    } finally {
      setLoading(null)
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/invoice/${invoice.token}`
    await navigator.clipboard.writeText(url)
    alert('Invoice link copied!')
  }

  if (invoice.status === 'paid') {
    return null
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
      <div className="space-y-3">
        {invoice.status === 'draft' && (
          <>
            <button
              onClick={handleCopyLink}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Invoice Link
            </button>
            <button
              onClick={handleMarkAsSent}
              disabled={loading === 'sent'}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading === 'sent' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Mark as Sent
                </>
              )}
            </button>
          </>
        )}

        {invoice.status === 'sent' && (
          <>
            <button
              onClick={handleCopyLink}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Invoice Link
            </button>
            <button
              onClick={handleMarkAsPaid}
              disabled={loading === 'paid'}
              className="btn-primary w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
            >
              {loading === 'paid' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark as Paid
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
