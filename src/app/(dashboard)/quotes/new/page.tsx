import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QuoteForm } from './QuoteForm'

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>
}) {
  const { request: requestId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Pobierz zapytanie
  let request = null
  if (requestId) {
    const { data } = await supabase
      .from('qs_quote_requests')
      .select('*')
      .eq('id', requestId)
      .eq('contractor_id', user?.id)
      .single()
    request = data
  }

  if (requestId && !request) {
    notFound()
  }

  // Pobierz usługi użytkownika
  const { data: services } = await supabase
    .from('qs_services')
    .select('*')
    .eq('user_id', user?.id)
    .order('name')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create Quote</h1>
        {request && (
          <p className="text-slate-400 mt-1">
            For: <span className="text-white">{request.client_name}</span>
          </p>
        )}
      </div>

      <QuoteForm
        request={request}
        services={services || []}
        userId={user?.id || ''}
      />
    </div>
  )
}
