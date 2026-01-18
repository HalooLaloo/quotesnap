import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'

export default async function RequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'

  const { data: requests } = await supabase
    .from('qs_quote_requests')
    .select('*')
    .eq('contractor_id', user?.id)
    .order('created_at', { ascending: false })

  // Generuj link do formularza zapytania dla klientów
  const requestFormUrl = `${protocol}://${host}/request/${user?.id}`

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Quote Requests</h1>
          <p className="text-slate-400 mt-1">
            Manage incoming quote requests from your clients.
          </p>
        </div>
      </div>

      {/* Share link */}
      <div className="card mb-8 bg-blue-600/10 border-blue-500/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium mb-1">Share your request link</h3>
            <p className="text-slate-400 text-sm mb-3">
              Send this link to clients so they can submit quote requests with photos and descriptions.
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

      {/* Requests list */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6">
          All Requests ({requests?.length || 0})
        </h2>

        {requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-medium">{request.client_name}</p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      request.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                      request.status === 'reviewing' ? 'bg-blue-500/20 text-blue-400' :
                      request.status === 'quoted' ? 'bg-purple-500/20 text-purple-400' :
                      request.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm truncate">{request.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    {request.client_email && <span>{request.client_email}</span>}
                    {request.client_phone && <span>{request.client_phone}</span>}
                    {request.address && <span>{request.address}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-slate-500 text-sm">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/requests/${request.id}`}
                    className="btn-secondary text-sm"
                  >
                    View
                  </Link>
                  {request.status === 'new' && (
                    <Link
                      href={`/quotes/new?request=${request.id}`}
                      className="btn-primary text-sm"
                    >
                      Create Quote
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">No requests yet</h3>
            <p className="text-slate-400 mb-4">Share your request link with clients to start receiving quote requests.</p>
          </div>
        )}
      </div>
    </div>
  )
}
