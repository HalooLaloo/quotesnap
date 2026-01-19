import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { QuoteItem } from '@/lib/types'
import { QuoteActions } from './QuoteActions'

// Use service role for public access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const { data: quote, error } = await supabase
    .from('qs_quotes')
    .select(`
      *,
      qs_quote_requests (
        client_name,
        client_email,
        client_phone,
        description
      )
    `)
    .eq('token', token)
    .single()

  if (error || !quote) {
    notFound()
  }

  // Get contractor info
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name, phone')
    .eq('id', quote.user_id)
    .single()

  const contractorName = profile?.company_name || profile?.full_name || 'Contractor'
  const items = (quote.items || []) as QuoteItem[]

  const statusInfo = {
    draft: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400' },
    sent: { label: 'Pending', color: 'bg-blue-500/20 text-blue-400' },
    accepted: { label: 'Accepted', color: 'bg-green-500/20 text-green-400' },
    rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
  }

  const status = statusInfo[quote.status as keyof typeof statusInfo] || statusInfo.draft

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <span className="text-2xl font-bold text-white">QuoteSnap</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Quote from {contractorName}</h1>
          <p className="text-slate-400 mt-2">
            For {quote.qs_quote_requests?.client_name}
          </p>
        </div>

        {/* Status banner */}
        {quote.status === 'accepted' && (
          <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 mb-6 text-center">
            <p className="text-green-400 font-medium">You have accepted this quote</p>
            {quote.accepted_at && (
              <p className="text-green-400/70 text-sm mt-1">
                on {new Date(quote.accepted_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {quote.status === 'rejected' && (
          <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400 font-medium">You have declined this quote</p>
          </div>
        )}

        {/* Quote card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Quote Details</h2>
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
                  <span className="font-medium text-white">{item.service_name}</span>
                  {item.reason && (
                    <p className="text-sm text-slate-400 mt-1">{item.reason}</p>
                  )}
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
              <span>{quote.subtotal?.toFixed(2)} PLN</span>
            </div>

            {quote.discount_percent > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Discount ({quote.discount_percent}%)</span>
                <span className="text-red-400">
                  -{(quote.subtotal * quote.discount_percent / 100).toFixed(2)} PLN
                </span>
              </div>
            )}

            {quote.vat_percent > 0 && (
              <>
                <div className="flex justify-between text-slate-300">
                  <span>Net</span>
                  <span>{quote.total_net?.toFixed(2)} PLN</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>VAT ({quote.vat_percent}%)</span>
                  <span>{(quote.total_net * quote.vat_percent / 100).toFixed(2)} PLN</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-slate-700">
              <span>Total</span>
              <span>{(quote.total_gross || quote.total)?.toFixed(2)} PLN</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="card mb-6 bg-amber-600/10 border-amber-500/30">
            <h3 className="font-medium text-amber-400 mb-2">Notes</h3>
            <p className="text-slate-300 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Dates */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {quote.valid_until && (
              <div>
                <p className="text-slate-400">Valid until</p>
                <p className="text-white font-medium">
                  {new Date(quote.valid_until).toLocaleDateString()}
                </p>
              </div>
            )}
            {quote.available_from && (
              <div>
                <p className="text-slate-400">Available from</p>
                <p className="text-white font-medium">
                  {new Date(quote.available_from).toLocaleDateString()}
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

        {/* Actions */}
        {quote.status === 'sent' && (
          <QuoteActions token={token} />
        )}

        {/* Disclaimer */}
        <p className="text-center text-slate-500 text-sm mt-8">
          This quote is an estimate based on the provided description.
          Final price may vary after on-site assessment.
        </p>
      </div>
    </div>
  )
}
