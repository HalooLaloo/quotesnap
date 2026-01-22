import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import Link from 'next/link'
import { RequestFilters } from '@/components/RequestFilters'
import { ShareLinkButton } from '@/components/ShareLinkButton'

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const { status, search } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'

  // Build query with filters
  let query = supabase
    .from('qs_quote_requests')
    .select('*')
    .eq('contractor_id', user?.id)

  if (status === 'all') {
    // Show all including archived
  } else if (status === 'archived') {
    query = query.eq('status', 'archived')
  } else if (status) {
    query = query.eq('status', status)
  } else {
    // Default: hide archived
    query = query.neq('status', 'archived')
  }

  if (search) {
    query = query.or(`client_name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data: requests } = await query.order('created_at', { ascending: false })

  // Count new requests for badge
  const newCount = requests?.filter(r => r.status === 'new').length || 0

  // Generate request form URL
  const requestFormUrl = `${protocol}://${host}/request/${user?.id}`

  return (
    <div className="p-4 md:p-6">
      {/* Compact header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Zapytania</h1>
          {newCount > 0 && (
            <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {newCount} nowe
            </span>
          )}
        </div>
        <ShareLinkButton url={requestFormUrl} />
      </div>

      {/* Filters */}
      <RequestFilters />

      {/* Requests list */}
      {requests && requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((request) => {
            // Extract work type from description (RODZAJ PRAC: xxx)
            const workTypeMatch = request.description.match(/RODZAJ PRAC:\s*([^\n]+)/i)
            const workType = workTypeMatch ? workTypeMatch[1].trim() : request.description.slice(0, 80)

            // Translate status to Polish
            const statusLabels: Record<string, string> = {
              'new': 'Nowe',
              'reviewing': 'W trakcie',
              'quoted': 'Wycenione',
              'accepted': 'Zaakceptowane',
              'rejected': 'Odrzucone',
              'archived': 'Archiwum'
            }
            const statusLabel = statusLabels[request.status] || request.status

            return (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className={`block p-4 rounded-lg transition-colors ${
                  request.status === 'new'
                    ? 'bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20'
                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium truncate">{request.client_name}</p>
                      <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${
                        request.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                        request.status === 'reviewing' ? 'bg-blue-500/20 text-blue-400' :
                        request.status === 'quoted' ? 'bg-purple-500/20 text-purple-400' :
                        request.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        request.status === 'archived' ? 'bg-slate-500/20 text-slate-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm truncate">{workType}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(request.created_at).toLocaleDateString('pl-PL')}
                      {request.client_phone && ` • ${request.client_phone}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {request.status === 'new' && (
                      <span className="btn-primary text-sm py-1.5 px-3">
                        Wyceń
                      </span>
                    )}
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {status || search ? 'Brak wyników' : 'Brak zapytań'}
          </h3>
          <p className="text-slate-400 text-sm mb-4 max-w-xs mx-auto">
            {status || search
              ? 'Spróbuj zmienić filtry lub wyszukiwanie.'
              : 'Udostępnij link klientom, aby mogli wysyłać zapytania.'}
          </p>
          {!status && !search && (
            <ShareLinkButton url={requestFormUrl} variant="primary" />
          )}
        </div>
      )}
    </div>
  )
}
