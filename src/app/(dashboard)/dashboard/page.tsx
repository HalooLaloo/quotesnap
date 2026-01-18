import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Pobierz statystyki
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

  // Pobierz ostatnie zapytania
  const { data: recentRequests } = await supabase
    .from('qs_quote_requests')
    .select('*')
    .eq('contractor_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here&apos;s your overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">My Services</p>
              <p className="text-3xl font-bold text-white mt-1">{servicesCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <Link href="/services" className="text-blue-500 text-sm mt-4 inline-block hover:text-blue-400">
            Manage services →
          </Link>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">New Requests</p>
              <p className="text-3xl font-bold text-white mt-1">{newRequestsCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
          <Link href="/requests" className="text-blue-500 text-sm mt-4 inline-block hover:text-blue-400">
            View requests →
          </Link>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pending Quotes</p>
              <p className="text-3xl font-bold text-white mt-1">{pendingQuotesCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link href="/quotes" className="text-blue-500 text-sm mt-4 inline-block hover:text-blue-400">
            View quotes →
          </Link>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Accepted</p>
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

      {/* Recent Requests */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Requests</h2>
          <Link href="/requests" className="text-blue-500 text-sm hover:text-blue-400">
            View all →
          </Link>
        </div>

        {recentRequests && recentRequests.length > 0 ? (
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{request.client_name}</p>
                  <p className="text-slate-400 text-sm truncate max-w-md">
                    {request.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    request.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                    request.status === 'quoted' ? 'bg-blue-500/20 text-blue-400' :
                    request.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {request.status}
                  </span>
                  <Link
                    href={`/requests/${request.id}`}
                    className="text-blue-500 hover:text-blue-400 text-sm"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">No requests yet.</p>
            <p className="text-slate-500 text-sm mt-1">
              Share your request link with clients to receive quotes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
