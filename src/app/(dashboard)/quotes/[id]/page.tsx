import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { QuoteItem } from '@/lib/types'
import { CollapsibleDescription } from './CollapsibleDescription'
import { ExportPDFButton } from '@/components/ExportPDFButton'
import { StatusTimeline, getQuoteTimelineSteps } from '@/components/StatusTimeline'
import { QuoteActions } from './QuoteActions'
import { COUNTRIES } from '@/lib/countries'

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const { data: quote } = await supabase
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
    .eq('id', id)
    .eq('user_id', user?.id)
    .single()

  if (!quote) {
    notFound()
  }

  // Get contractor profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name, country')
    .eq('id', user?.id)
    .single()

  const contractorName = profile?.company_name || profile?.full_name || ''
  const currencySymbol = getCurrencySymbol(quote.currency || 'USD')
  const countryCode = profile?.country || 'US'
  const countryConfig = COUNTRIES[countryCode] || COUNTRIES.US

  const isExpired = quote.status !== 'accepted' && quote.status !== 'rejected' && quote.status !== 'expired' &&
    quote.valid_until && new Date(quote.valid_until) < new Date()

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-400',
    sent: 'bg-blue-500/20 text-blue-400',
    accepted: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    expired: 'bg-orange-500/20 text-orange-400',
  }

  const items = (quote.items || []) as QuoteItem[]

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Link
          href="/quotes"
          className="text-slate-400 hover:text-white text-sm mb-3 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Quotes
        </Link>

        <div className="card mt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-full ${
                  isExpired ? statusColors.expired : (statusColors[quote.status] || 'bg-slate-500/20 text-slate-400')
                }`}>
                  {isExpired ? 'Expired' :
                   quote.status === 'draft' ? 'Draft' :
                   quote.status === 'sent' ? 'Sent' :
                   quote.status === 'accepted' ? 'Accepted' :
                   quote.status === 'rejected' ? 'Rejected' :
                   quote.status === 'expired' ? 'Expired' : quote.status}
                </span>
                <span className="text-slate-500 text-sm">
                  {new Date(quote.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-2">
                {quote.qs_quote_requests?.client_name || 'Client'}
              </h1>
              {quote.qs_quote_requests?.client_email && (
                <p className="text-slate-400 text-sm mt-0.5">{quote.qs_quote_requests.client_email}</p>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {(quote.status === 'draft' || quote.status === 'sent') && (
                <Link
                  href={`/quotes/${quote.id}/edit`}
                  className="btn-secondary inline-flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
              )}
              <ExportPDFButton quote={quote} contractorName={contractorName} countryCode={countryCode} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Quote Items</h2>

            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      item.isCustom
                        ? 'bg-amber-600/10 border border-amber-500/30'
                        : 'bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{item.service_name}</span>
                        </div>
                        {item.reason && (
                          <p className="text-sm text-purple-400 mt-1">{item.reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-sm">
                          {item.quantity} {item.unit} × {currencySymbol}{item.unit_price.toFixed(2)}
                        </div>
                        <div className="font-semibold text-white">
                          {currencySymbol}{item.total.toFixed(2)}
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

          {/* Notes */}
          {quote.notes && (() => {
            const rawNotes = quote.notes || ''
            const [generalNotes, clientAnswer] = rawNotes.split('---CLIENT_ANSWER---').map((s: string) => s.trim())
            const questionMatch = quote.qs_quote_requests?.description?.match(/QUESTION FOR CONTRACTOR:\s*([\s\S]+?)(?=\n\n|---CONVERSATION---|$)/)
            const clientQuestion = questionMatch?.[1]?.trim()

            return (
              <>
                {generalNotes && (
                  <div className="card">
                    <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
                    <p className="text-slate-300 whitespace-pre-wrap">{generalNotes}</p>
                  </div>
                )}
                {clientQuestion && clientAnswer && (
                  <div className="card bg-purple-600/10 border-purple-500/30">
                    <h2 className="text-lg font-semibold text-purple-400 mb-4">Client Q&A</h2>
                    <div className="mb-3">
                      <p className="text-xs text-purple-400 uppercase tracking-wide mb-1">Client&apos;s question</p>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">{clientQuestion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-400 uppercase tracking-wide mb-1">Your answer</p>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">{clientAnswer}</p>
                    </div>
                  </div>
                )}
              </>
            )
          })()}

          {/* Original request */}
          {quote.qs_quote_requests?.description && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Job Description</h2>
              <CollapsibleDescription description={quote.qs_quote_requests.description} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions (draft only) */}
          <QuoteActions
            quote={{ id: quote.id, status: quote.status, token: quote.token, request_id: quote.request_id }}
            clientEmail={quote.qs_quote_requests?.client_email || null}
          />

          {/* Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span>{currencySymbol}{quote.subtotal?.toFixed(2) || '0.00'}</span>
              </div>

              {quote.discount_percent > 0 && (
                <>
                  <div className="flex justify-between text-slate-300">
                    <span>Discount ({quote.discount_percent}%)</span>
                    <span className="text-red-400">
                      -{currencySymbol}{(quote.subtotal * quote.discount_percent / 100).toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Estimate</span>
                  <span>{quote.total?.toFixed(2) || '0.00'}</span>
                </div>
                <p className="text-slate-500 text-xs mt-1">Price may vary slightly</p>
              </div>
            </div>

            {quote.valid_until && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  Valid until: <span className="text-white">{new Date(quote.valid_until).toLocaleDateString('en-US')}</span>
                </p>
              </div>
            )}
          </div>

          {/* Contact info */}
          {quote.qs_quote_requests && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Client Details</h2>
              <div className="space-y-3">
                <p className="text-white font-medium">{quote.qs_quote_requests.client_name}</p>
                {quote.qs_quote_requests.client_email && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${quote.qs_quote_requests.client_email}`} className="text-blue-400 hover:text-blue-300 text-sm">
                      {quote.qs_quote_requests.client_email}
                    </a>
                  </div>
                )}
                {quote.qs_quote_requests.client_phone && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${quote.qs_quote_requests.client_phone}`} className="text-blue-400 hover:text-blue-300 text-sm">
                      {quote.qs_quote_requests.client_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <StatusTimeline steps={getQuoteTimelineSteps(quote)} />

          {/* Create Invoice button for accepted/sent quotes */}
          {(quote.status === 'accepted' || quote.status === 'sent') && (
            <div className="card bg-blue-600/10 border-blue-500/30">
              <h3 className="text-blue-400 font-medium mb-2">
                {quote.status === 'accepted' ? 'Work completed?' : 'Ready to invoice?'}
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Create an invoice based on this quote.
              </p>
              <Link
                href={`/invoices/new?from_quote=${quote.id}`}
                className="btn-primary w-full text-center flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Create Invoice
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
