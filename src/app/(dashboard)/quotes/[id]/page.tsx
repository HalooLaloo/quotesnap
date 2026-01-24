import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { QuoteItem } from '@/lib/types'
import { CollapsibleDescription } from './CollapsibleDescription'
import { ExportPDFButton } from '@/components/ExportPDFButton'
import { StatusTimeline, getQuoteTimelineSteps } from '@/components/StatusTimeline'

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    .select('full_name, company_name')
    .eq('id', user?.id)
    .single()

  const contractorName = profile?.company_name || profile?.full_name || ''

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-400',
    sent: 'bg-blue-500/20 text-blue-400',
    accepted: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  }

  const items = (quote.items || []) as QuoteItem[]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/quotes"
          className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Powrót do wycen
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Wycena dla {quote.qs_quote_requests?.client_name || 'Klienta'}
            </h1>
            <p className="text-slate-400 mt-1">
              Utworzono {new Date(quote.created_at).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportPDFButton quote={quote} contractorName={contractorName} />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[quote.status] || 'bg-slate-500/20 text-slate-400'}`}>
              {quote.status === 'draft' ? 'Szkic' :
               quote.status === 'sent' ? 'Wysłana' :
               quote.status === 'accepted' ? 'Zaakceptowana' :
               quote.status === 'rejected' ? 'Odrzucona' : quote.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Pozycje wyceny</h2>

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
              <p className="text-slate-400 text-center py-8">Brak pozycji</p>
            )}
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Uwagi</h2>
              <p className="text-slate-300 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* Original request */}
          {quote.qs_quote_requests?.description && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Opis zlecenia</h2>
              <CollapsibleDescription description={quote.qs_quote_requests.description} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Podsumowanie</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-slate-300">
                <span>Suma częściowa</span>
                <span>{quote.subtotal?.toFixed(2) || '0.00'} PLN</span>
              </div>

              {quote.discount_percent > 0 && (
                <>
                  <div className="flex justify-between text-slate-300">
                    <span>Rabat ({quote.discount_percent}%)</span>
                    <span className="text-red-400">
                      -{(quote.subtotal * quote.discount_percent / 100).toFixed(2)} PLN
                    </span>
                  </div>
                </>
              )}

              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Razem</span>
                  <span>{quote.total?.toFixed(2) || '0.00'} PLN</span>
                </div>
              </div>
            </div>

            {quote.valid_until && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  Ważna do: <span className="text-white">{new Date(quote.valid_until).toLocaleDateString('pl-PL')}</span>
                </p>
              </div>
            )}
          </div>

          {/* Contact info */}
          {quote.qs_quote_requests && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Dane klienta</h2>
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

          {/* Create Invoice button for accepted quotes */}
          {quote.status === 'accepted' && (
            <div className="card bg-blue-600/10 border-blue-500/30">
              <h3 className="text-blue-400 font-medium mb-2">Praca wykonana?</h3>
              <p className="text-slate-400 text-sm mb-4">
                Stwórz fakturę na podstawie tej wyceny.
              </p>
              <Link
                href={`/invoices/new?from_quote=${quote.id}`}
                className="btn-primary w-full text-center flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Stwórz fakturę
              </Link>
            </div>
          )}

          {/* Create Invoice option for sent quotes (client confirmed verbally) */}
          {quote.status === 'sent' && (
            <div className="card border-slate-600">
              <Link
                href={`/invoices/new?from_quote=${quote.id}`}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Stwórz fakturę (klient potwierdził ustnie)
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
