import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { QuoteForm } from '../../new/QuoteForm'
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/countries'
import Link from 'next/link'

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/login')

  // Load existing quote
  const { data: quote } = await supabase
    .from('qs_quotes')
    .select(`
      *,
      qs_quote_requests (
        id,
        client_name,
        description
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!quote) notFound()

  // Only allow editing draft/sent quotes (not accepted/rejected/expired)
  if (quote.status === 'accepted' || quote.status === 'rejected') {
    redirect(`/quotes/${id}`)
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('country, currency, full_name, company_name, phone')
    .eq('id', user.id)
    .single()

  const countryCode = profile?.country || DEFAULT_COUNTRY
  const country = COUNTRIES[countryCode] || COUNTRIES[DEFAULT_COUNTRY]

  // Get services
  const { data: services } = await supabase
    .from('qs_services')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <Link
          href={`/quotes/${id}`}
          className="text-slate-400 hover:text-white text-sm mb-3 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Quote
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">Edit Quote</h1>
        {quote.qs_quote_requests?.client_name && (
          <p className="text-slate-400 mt-1">
            For: <span className="text-white">{quote.qs_quote_requests.client_name}</span>
          </p>
        )}
      </div>

      <QuoteForm
        request={quote.qs_quote_requests || null}
        services={services || []}
        userId={user.id}
        currency={country.currency}
        currencySymbol={country.currencySymbol}
        taxLabel={country.taxLabel}
        defaultTaxPercent={country.defaultTaxPercent}
        profileComplete={!!(profile?.full_name && profile?.company_name && profile?.phone)}
        measurementSystem={country.measurementSystem}
        contractorName={profile?.company_name || profile?.full_name || ''}
        contractorPhone={profile?.phone || ''}
        existingQuote={{
          id: quote.id,
          token: quote.token,
          items: quote.items || [],
          notes: quote.notes,
          discount_percent: quote.discount_percent || 0,
          vat_percent: quote.vat_percent || 0,
          valid_until: quote.valid_until,
          available_from: quote.available_from,
          status: quote.status,
        }}
      />
    </div>
  )
}
