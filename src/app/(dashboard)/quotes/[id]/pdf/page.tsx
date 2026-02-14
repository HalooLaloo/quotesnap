import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { QuoteItem } from '@/lib/types'
import { COUNTRIES } from '@/lib/countries'
import { PrintButton } from './PrintButton'

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

export default async function QuotePDFPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: quote } = await supabase
    .from('qs_quotes')
    .select(`*, qs_quote_requests(client_name, client_email, client_phone)`)
    .eq('id', id)
    .eq('user_id', user?.id)
    .single()

  if (!quote) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name, country')
    .eq('id', user?.id)
    .single()

  const contractorName = profile?.company_name || profile?.full_name || 'Contractor'
  const clientName = quote.qs_quote_requests?.client_name || 'Client'
  const countryCode = profile?.country || 'US'
  const countryConfig = COUNTRIES[countryCode] || COUNTRIES.US
  const cs = getCurrencySymbol(quote.currency || 'USD')

  const items: QuoteItem[] = Array.isArray(quote.items)
    ? quote.items
    : typeof quote.items === 'string'
      ? JSON.parse(quote.items)
      : []

  const subtotal = Number(quote.subtotal) || 0
  const discountPercent = Number(quote.discount_percent) || 0
  const vatPercent = Number(quote.vat_percent) || 0
  const totalNet = Number(quote.total_net) || 0
  const totalGross = Number(quote.total_gross) || Number(quote.total) || 0
  const pdfNotes = quote.notes?.split('---CLIENT_ANSWER---')[0]?.trim()

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-doc {
            box-shadow: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      {/* Navigation bar - hidden when printing */}
      <div className="no-print p-4 md:p-8 pb-0">
        <Link
          href={`/quotes/${id}`}
          className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Quote
        </Link>
      </div>

      {/* Print / Save button - hidden when printing */}
      <div className="no-print px-4 md:px-8 py-3">
        <PrintButton clientName={clientName} quoteId={id} />
      </div>

      {/* The document itself - styled like a PDF */}
      <div className="px-4 md:px-8 pb-8">
        <div
          className="print-doc bg-white rounded-lg shadow-xl mx-auto"
          style={{ maxWidth: '800px', color: '#000' }}
        >
          {/* Header */}
          <div
            style={{
              background: '#1e3a5f',
              padding: '20px 30px',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: '22px', fontWeight: 'bold' }}>
              BrickQuote
            </span>
            <span style={{ color: '#fff', fontSize: '14px' }}>
              Quote
            </span>
          </div>

          {/* Content */}
          <div style={{ padding: '16px' }} className="md:!p-[30px]">
            {/* Contractor & Client */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Contractor
                </div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>{contractorName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Client
                </div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>{clientName}</div>
                {quote.qs_quote_requests?.client_phone && (
                  <div style={{ fontSize: '13px', color: '#555' }}>
                    Tel: {quote.qs_quote_requests.client_phone}
                  </div>
                )}
                {quote.qs_quote_requests?.client_email && (
                  <div style={{ fontSize: '13px', color: '#555' }}>
                    {quote.qs_quote_requests.client_email}
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', fontSize: '13px', color: '#666', flexWrap: 'wrap' }}>
              <span>Quote date: {new Date(quote.created_at).toLocaleDateString('en-US')}</span>
              {quote.valid_until && (
                <span>Valid until: {new Date(quote.valid_until).toLocaleDateString('en-US')}</span>
              )}
              {quote.available_from && (
                <span>Available from: {new Date(quote.available_from).toLocaleDateString('en-US')}</span>
              )}
            </div>

            {/* Items table */}
            <div className="scrollbar-light" style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                <thead>
                  <tr style={{ background: '#1e3a5f' }}>
                    <th style={{ color: '#fff', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>
                      Service
                    </th>
                    <th style={{ color: '#fff', padding: '8px 10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      Qty
                    </th>
                    <th style={{ color: '#fff', padding: '8px 10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      Unit Price
                    </th>
                    <th style={{ color: '#fff', padding: '8px 10px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', fontSize: '12px' }}>
                        {item.service_name || ''}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {Number(item.quantity) || 0} {item.unit || ''}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {cs}{(Number(item.unit_price) || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {cs}{(Number(item.total) || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
                  <span>Subtotal:</span>
                  <span>{cs}{subtotal.toFixed(2)}</span>
                </div>

                {discountPercent > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
                    <span>Discount ({discountPercent}%):</span>
                    <span style={{ color: '#dc2626' }}>-{cs}{(subtotal * discountPercent / 100).toFixed(2)}</span>
                  </div>
                )}

                {vatPercent > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
                      <span>Net:</span>
                      <span>{cs}{totalNet.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
                      <span>{countryConfig.taxLabel} ({vatPercent}%):</span>
                      <span>{cs}{(totalNet * vatPercent / 100).toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div style={{ borderTop: '2px solid #1e3a5f', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f' }}>
                  <span>TOTAL:</span>
                  <span>{cs}{totalGross.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {pdfNotes && (
              <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Notes:</div>
                <div style={{ fontSize: '13px', color: '#555', whiteSpace: 'pre-wrap' }}>{pdfNotes}</div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f' }}>
                Thank you for your interest!
              </div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '12px' }}>
                Quote generated by BrickQuote
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                This quote is an estimate. Final price may vary after on-site assessment.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
