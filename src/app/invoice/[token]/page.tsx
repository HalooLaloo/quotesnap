import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { InvoiceItem } from '@/lib/types'

// Disable caching for this page - needs fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Use service role for public access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: invoice, error } = await supabase
    .from('qs_invoices')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !invoice) {
    notFound()
  }

  // Get contractor info
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name, phone, email, bank_name, bank_account, tax_id, business_address')
    .eq('id', invoice.user_id)
    .single()

  const contractorName = profile?.company_name || profile?.full_name || 'Contractor'
  const items = (invoice.items || []) as InvoiceItem[]

  const statusInfo = {
    draft: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400' },
    sent: { label: 'Awaiting Payment', color: 'bg-blue-500/20 text-blue-400' },
    paid: { label: 'Paid', color: 'bg-green-500/20 text-green-400' },
  }

  const status = statusInfo[invoice.status as keyof typeof statusInfo] || statusInfo.draft

  return (
    <div className="min-h-screen bg-[#0a1628] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#132039] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="9" height="5" rx="0.5" />
                <rect x="13" y="6" width="9" height="5" rx="0.5" />
                <rect x="6" y="13" width="9" height="5" rx="0.5" />
                <rect x="17" y="13" width="5" height="5" rx="0.5" />
                <rect x="2" y="13" width="2" height="5" rx="0.5" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">BrickQuote</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Invoice from {contractorName}</h1>
          <p className="text-slate-400 mt-2">{invoice.invoice_number}</p>
        </div>

        {/* Status banner */}
        {invoice.status === 'paid' && (
          <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 mb-6 text-center">
            <p className="text-green-400 font-medium">This invoice has been paid</p>
            {invoice.paid_at && (
              <p className="text-green-400/70 text-sm mt-1">
                on {new Date(invoice.paid_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Invoice card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Invoice Details</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>

          {/* Items */}
          <div className="space-y-3 mb-6">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
              >
                <div className="flex-1">
                  <span className="font-medium text-white">{item.description}</span>
                </div>
                <div className="text-right ml-4">
                  <div className="text-slate-400 text-sm">
                    {item.quantity} {item.unit} x {item.unit_price.toFixed(2)} PLN
                  </div>
                  <div className="font-semibold text-white">
                    {item.total.toFixed(2)} PLN
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-slate-700 pt-4 space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span>
              <span>{invoice.subtotal?.toFixed(2)} PLN</span>
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
              <span>{invoice.total_net?.toFixed(2)} PLN</span>
            </div>

            {invoice.vat_percent > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>VAT ({invoice.vat_percent}%)</span>
                <span>{(invoice.total_net * invoice.vat_percent / 100).toFixed(2)} PLN</span>
              </div>
            )}

            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-slate-700">
              <span>Amount Due</span>
              <span>{invoice.total_gross?.toFixed(2)} PLN</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        {(profile?.bank_name || profile?.bank_account || invoice.payment_terms) && (
          <div className="card mb-6 bg-green-600/10 border-green-500/30">
            <h3 className="font-medium text-green-400 mb-4">Payment Details</h3>
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
                  <p className="text-white font-mono text-lg">{profile.bank_account}</p>
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
          <div className="card mb-6 bg-amber-600/10 border-amber-500/30">
            <h3 className="font-medium text-amber-400 mb-2">Notes</h3>
            <p className="text-slate-300 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Dates */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Invoice Date</p>
              <p className="text-white font-medium">
                {new Date(invoice.created_at).toLocaleDateString()}
              </p>
            </div>
            {invoice.due_date && (
              <div>
                <p className="text-slate-400">Due Date</p>
                <p className="text-white font-medium">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        {profile?.phone && (
          <div className="card mb-6">
            <h3 className="font-medium text-white mb-3">Contact {contractorName}</h3>
            <a
              href={`tel:${profile.phone}`}
              className="btn-secondary w-full text-center flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {profile.phone}
            </a>
          </div>
        )}

        {/* Download PDF */}
        <div className="text-center mb-6">
          <a
            href={`/api/invoice-pdf/${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Invoice generated by BrickQuote
        </p>
      </div>
    </div>
  )
}
