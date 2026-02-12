import { createClient } from '@/lib/supabase/server'
import { QuotesList } from './QuotesList'
import { PageGuideCard } from '@/components/onboarding/PageGuideCard'

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: quotes } = await supabase
    .from('qs_quotes')
    .select(`
      *,
      qs_quote_requests (
        client_name,
        client_email,
        description
      )
    `)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Quotes</h1>
        <p className="text-slate-400 mt-1">
          View and manage all your quotes.
        </p>
      </div>

      <PageGuideCard
        pageKey="quotes"
        userId={user!.id}
        icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        title="Your Quotes"
        description="Here you'll find all your quotes. Create them from client requests — AI will suggest line items and prices from your service list. Send them to clients by email with one click."
      />

      <QuotesList quotes={quotes || []} />
    </div>
  )
}
