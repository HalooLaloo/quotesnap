'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Invoice {
  id: string
  status: string
  client_email: string | null
  token: string
  reminder_sent_at: string | null
  reminder_count: number
}

interface InvoiceActionsProps {
  invoice: Invoice
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSendToClient = async () => {
    if (!invoice.client_email) {
      alert('No client email address')
      return
    }

    setLoading('sending')
    try {
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send')
      }

      router.refresh()
    } catch (err) {
      console.error('Error sending invoice:', err)
      alert('Failed to send invoice')
    } finally {
      setLoading(null)
    }
  }

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
      const response = await fetch('/api/mark-invoice-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to mark as paid')
      }

      router.refresh()
    } catch (err) {
      console.error('Error marking as paid:', err)
      alert('Failed to update invoice')
    } finally {
      setLoading(null)
    }
  }

  const handleSendReminder = async () => {
    if (!invoice.client_email) {
      alert('No client email address')
      return
    }

    setLoading('reminder')
    try {
      const response = await fetch('/api/send-invoice-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send reminder')
      }

      router.refresh()
    } catch (err) {
      console.error('Error sending reminder:', err)
      alert('Failed to send reminder')
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
            {invoice.client_email && (
              <button
                onClick={handleSendToClient}
                disabled={loading === 'sending'}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading === 'sending' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send to Client
                  </>
                )}
              </button>
            )}
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
              className="btn-secondary w-full flex items-center justify-center gap-2"
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
            {invoice.client_email && (
              <div>
                <button
                  onClick={handleSendReminder}
                  disabled={loading === 'reminder'}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading === 'reminder' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Send Payment Reminder
                    </>
                  )}
                </button>
                {invoice.reminder_sent_at && (
                  <p className="text-slate-500 text-xs mt-1.5 text-center">
                    Last reminder: {new Date(invoice.reminder_sent_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                    {invoice.reminder_count > 1 && ` (${invoice.reminder_count} sent)`}
                  </p>
                )}
              </div>
            )}
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
