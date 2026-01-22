import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InvoiceItem } from '@/lib/types'
import { InvoiceActions } from './InvoiceActions'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoice } = await supabase
    .from('qs_invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', user?.id)
    .single()

  if (!invoice) {
    notFound()
  }

  // Get contractor profile for business details
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name, phone, bank_name, bank_account, tax_id, business_address')
    .eq('id', user?.id)
    .single()

  const contractorName = profile?.company_name || profile?.full_name || ''

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-400',
    sent: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
  }

  const items = (invoice.items || []) as InvoiceItem[]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/invoices"
          className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoices
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {invoice.invoice_number}
            </h1>
            <p className="text-slate-400 mt-1">
              Created {new Date(invoice.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/api/invoice-pdf/${invoice.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </a>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[invoice.status] || 'bg-slate-500/20 text-slate-400'}`}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Invoice Items</h2>

            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium text-white">{item.description}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-sm">
                          {item.quantity} {item.unit} × {item.unit_price.toFixed(2)} PLN
                        </div>
                        <div className="font-semibold text-white">
                          {item.total.toFixed(2)} PLN
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No items</p>
            )}
          </div>

          {/* Payment Details */}
          {(profile?.bank_name || profile?.bank_account || invoice.payment_terms) && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Payment Details</h2>
              <div className="space-y-3">
                {profile?.bank_name && (
                  <div>
                    <p className="text-slate-400 text-sm">Bank</p>
                    <p className="text-white">{profile.bank_name}</p>
                  </div>
                )}
                {profile?.bank_account && (
                  <div>
                    <p className="text-slate-400 text-sm">Account Number</p>
                    <p className="text-white font-mono">{profile.bank_account}</p>
                  </div>
                )}
                {invoice.payment_terms && (
                  <div>
                    <p className="text-slate-400 text-sm">Payment Terms</p>
                    <p className="text-white">{invoice.payment_terms}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
              <p className="text-slate-300 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span>{invoice.subtotal?.toFixed(2) || '0.00'} PLN</span>
              </div>

              {invoice.discount_percent > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Discount ({invoice.discount_percent}%)</span>
                  <span className="text-red-400">
                    -{(invoice.subtotal * invoice.discount_percent / 100).toFixed(2)} PLN
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span>Net</span>
                <span>{invoice.total_net?.toFixed(2) || '0.00'} PLN</span>
              </div>

              {invoice.vat_percent > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>VAT ({invoice.vat_percent}%)</span>
                  <span>{(invoice.total_net * invoice.vat_percent / 100).toFixed(2)} PLN</span>
                </div>
              )}

              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Amount Due</span>
                  <span>{invoice.total_gross?.toFixed(2) || '0.00'} PLN</span>
                </div>
              </div>
            </div>

            {invoice.due_date && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  Due Date: <span className="text-white">{new Date(invoice.due_date).toLocaleDateString('en-US')}</span>
                </p>
              </div>
            )}
          </div>

          {/* Client Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Client</h2>
            <div className="space-y-3">
              <p className="text-white font-medium">{invoice.client_name}</p>
              {invoice.client_email && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${invoice.client_email}`} className="text-blue-400 hover:text-blue-300 text-sm">
                    {invoice.client_email}
                  </a>
                </div>
              )}
              {invoice.client_phone && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${invoice.client_phone}`} className="text-blue-400 hover:text-blue-300 text-sm">
                    {invoice.client_phone}
                  </a>
                </div>
              )}
              {invoice.client_address && (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-slate-300 text-sm">{invoice.client_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <InvoiceActions invoice={invoice} />

          {/* Status timestamps */}
          {invoice.sent_at && (
            <div className="card bg-blue-600/10 border-blue-500/30">
              <p className="text-blue-400 text-sm">
                Sent: {new Date(invoice.sent_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}

          {invoice.paid_at && (
            <div className="card bg-green-600/10 border-green-500/30">
              <p className="text-green-400 text-sm">
                Paid: {new Date(invoice.paid_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
