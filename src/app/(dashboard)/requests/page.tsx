import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'
import { RequestFilters } from '@/components/RequestFilters'
import { ShareLinkButton } from '@/components/ShareLinkButton'
import { PageGuideCard } from '@/components/onboarding/PageGuideCard'
import { WhatsNextCard } from '@/components/onboarding/WhatsNextCard'

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
          <h1 className="text-2xl font-bold text-white">Requests</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage quote requests from your clients
          </p>
        </div>
        <ShareLinkButton url={requestFormUrl} />
      </div>

      <WhatsNextCard userId={user!.id} requestFormUrl={requestFormUrl} />

      <PageGuideCard
        pageKey="requests"
        userId={user!.id}
        icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>}
        title="Your Client Requests"
        description="This is where requests from your clients appear. Share your link with clients so they can describe their job and send photos. You'll see every new request here."
      />

      {/* Requests list - FIRST */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Request List
          </h2>
          {(newRequestsCount || 0) > 0 && (
            <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              {newRequestsCount} new
            </span>
          )}
        </div>

        <RequestFilters />

        {requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((request) => {
              // Extract work type from description (TYPE OF WORK or RODZAJ PRAC)
              const workTypeMatch = request.description.match(/(?:TYPE OF WORK|RODZAJ PRAC):\s*([^\n]+)/i)
              const workType = workTypeMatch ? workTypeMatch[1].trim() : request.description.slice(0, 80)

              // Status labels
              const statusLabels: Record<string, string> = {
                'new': 'New',
                'reviewing': 'Reviewing',
                'quoted': 'Quoted',
                'accepted': 'Accepted',
                'rejected': 'Rejected',
                'archived': 'Archived'
              }
              const statusLabel = statusLabels[request.status] || request.status

              const cardStyles: Record<string, string> = {
                'new': 'border-l-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10',
                'reviewing': 'border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10',
                'quoted': 'border-l-purple-500 bg-purple-500/5 hover:bg-purple-500/10',
                'accepted': 'border-l-green-500 bg-green-500/5 hover:bg-green-500/10',
                'rejected': 'border-l-red-500 bg-red-500/5 hover:bg-red-500/10',
                'archived': 'border-l-slate-500 bg-slate-700/30 hover:bg-slate-700/60',
              }

              return (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className={`block p-4 rounded-lg border-l-4 transition-colors ${
                    cardStyles[request.status] || cardStyles.archived
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
                        {new Date(request.created_at).toLocaleDateString('en-US')}
                        {request.client_phone && ` • ${request.client_phone}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {request.status === 'new' && (
                        <span className="btn-primary text-sm py-1.5 px-3">
                          Quote
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
              {status || search ? 'No results' : 'No requests yet'}
            </h3>
            <p className="text-slate-400 mb-4">
              {status || search
                ? 'Try adjusting your filters or search.'
                : 'Share your link with clients to start receiving requests.'}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-6 mb-6">
        <div className="card p-3 md:p-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-1 md:gap-2">
            <div className="order-2 md:order-1">
              <p className="text-slate-400 text-[11px] md:text-sm">New</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{newRequestsCount || 0}</p>
            </div>
            <div className="order-1 md:order-2 w-8 h-8 md:w-12 md:h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 md:w-6 md:h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-3 md:p-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-1 md:gap-2">
            <div className="order-2 md:order-1">
              <p className="text-slate-400 text-[11px] md:text-sm">Pending</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{pendingQuotesCount || 0}</p>
            </div>
            <div className="order-1 md:order-2 w-8 h-8 md:w-12 md:h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 md:w-6 md:h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link href="/quotes" className="text-blue-500 text-[10px] md:text-sm mt-1 md:mt-4 inline-block hover:text-blue-400">
            View →
          </Link>
        </div>

        <div className="card p-3 md:p-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-1 md:gap-2">
            <div className="order-2 md:order-1">
              <p className="text-slate-400 text-[11px] md:text-sm">Accepted</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{acceptedQuotesCount || 0}</p>
            </div>
            <div className="order-1 md:order-2 w-8 h-8 md:w-12 md:h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 md:w-6 md:h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h3 className="text-white font-medium mb-1">Your Request Link</h3>
            <p className="text-slate-400 text-sm mb-3">
              Share this link with clients so they can submit quote requests with photos.
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
