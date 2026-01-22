import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'
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

  // Stats
  const { count: servicesCount } = await supabase
    .from('qs_services')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  const { count: newRequestsCount } = await supabase
    .from('qs_quote_requests')
    .select('*', { count: 'exact', head: true })
    .eq('contractor_id', user?.id)
    .eq('status', 'new')

  const { count: pendingQuotesCount } = await supabase
    .from('qs_quotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('status', 'sent')

  const { count: acceptedQuotesCount } = await supabase
    .from('qs_quotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('status', 'accepted')

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

  // Generate request form URL
  const requestFormUrl = `${protocol}://${host}/request/${user?.id}`

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Zapytania</h1>
          <p className="text-slate-400 text-sm mt-1">
            Zarządzaj zapytaniami od klientów
          </p>
        </div>
        <ShareLinkButton url={requestFormUrl} />
      </div>

      {/* Requests list - FIRST */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Lista zapytań
          </h2>
          {(newRequestsCount || 0) > 0 && (
            <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              {newRequestsCount} nowe
            </span>
          )}
        </div>

        <RequestFilters />

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
                      : 'bg-slate-700/50 hover:bg-slate-700'
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
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">
              {status || search ? 'Brak wyników' : 'Brak zapytań'}
            </h3>
            <p className="text-slate-400 mb-4">
              {status || search
                ? 'Spróbuj zmienić filtry lub wyszukiwanie.'
                : 'Wyślij link do zapytań klientom, aby zaczęli przesyłać zapytania.'}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Moje usługi</p>
              <p className="text-3xl font-bold text-white mt-1">{servicesCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <Link href="/services" className="text-blue-500 text-sm mt-4 inline-block hover:text-blue-400">
            Zarządzaj →
          </Link>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Nowe zapytania</p>
              <p className="text-3xl font-bold text-white mt-1">{newRequestsCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Oczekujące wyceny</p>
              <p className="text-3xl font-bold text-white mt-1">{pendingQuotesCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link href="/quotes" className="text-blue-500 text-sm mt-4 inline-block hover:text-blue-400">
            Zobacz →
          </Link>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Zaakceptowane</p>
              <p className="text-3xl font-bold text-white mt-1">{acceptedQuotesCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Share link */}
      <div className="card bg-blue-600/10 border-blue-500/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium mb-1">Twój link do zapytań</h3>
            <p className="text-slate-400 text-sm mb-3">
              Wyślij ten link klientom, aby mogli przesłać zapytania ze zdjęciami.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={requestFormUrl}
                className="input flex-1 text-sm"
              />
              <CopyButton text={requestFormUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
