import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AcceptedQuotes } from './AcceptedQuotes'
import { SentQuotes } from './SentQuotes'
import { InvoicesList } from './InvoicesList'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoices } = await supabase
    .from('qs_invoices')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  // Get accepted quotes
  const { data: acceptedQuotes } = await supabase
    .from('qs_quotes')
    .select(`
      id,
      total_gross,
      total,
      status,
      created_at,
      currency,
      qs_quote_requests (
        client_name,
        client_email
      )
    `)
    .eq('user_id', user?.id)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })

  // Get sent quotes (for verbal confirmations)
  const { data: sentQuotes } = await supabase
    .from('qs_quotes')
    .select(`
      id,
      total_gross,
      total,
      status,
      created_at,
      currency,
      qs_quote_requests (
        client_name,
        client_email
      )
    `)
    .eq('user_id', user?.id)
    .eq('status', 'sent')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Faktury</h1>
          <p className="text-slate-400 mt-1">
            Twórz i zarządzaj fakturami za wykonane prace.
          </p>
        </div>
        <Link href="/invoices/new" className="btn-primary">
          + Nowa faktura
        </Link>
      </div>

      {/* Accepted Quotes Section */}
      <AcceptedQuotes quotes={acceptedQuotes || []} />

      {/* Sent Quotes - for verbal confirmations */}
      <SentQuotes quotes={sentQuotes || []} />

      {/* Invoices List with search, filter, stats */}
      <InvoicesList invoices={invoices || []} />
    </div>
  )
}
