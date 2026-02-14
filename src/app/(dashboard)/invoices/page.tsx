import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AcceptedQuotes } from './AcceptedQuotes'
import { SentQuotes } from './SentQuotes'
import { InvoicesList } from './InvoicesList'
import { PageGuideCard } from '@/components/onboarding/PageGuideCard'

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
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Invoices</h1>
          <p className="text-slate-400 text-sm mt-1">
            Create and manage invoices for completed work.
          </p>
        </div>
        <Link href="/invoices/new" className="btn-primary inline-flex items-center gap-1.5 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Invoice</span>
        </Link>
      </div>

      <PageGuideCard
        pageKey="invoices"
        userId={user!.id}
        icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        title="Your Invoices"
        description="After a client accepts your quote, create an invoice here to get paid. You can also create standalone invoices. Send them by email to your clients."
      />

      {/* Accepted Quotes Section */}
      <AcceptedQuotes quotes={acceptedQuotes || []} />

      {/* Sent Quotes - for verbal confirmations */}
      <SentQuotes quotes={sentQuotes || []} />

      {/* Invoices List with search, filter, stats */}
      <InvoicesList invoices={invoices || []} />
    </div>
  )
}
