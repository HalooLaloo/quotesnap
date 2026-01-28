import { createClient } from '@/lib/supabase/server'
import { QuotesList } from './QuotesList'

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

      <QuotesList quotes={quotes || []} />
    </div>
  )
}
