import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { COUNTRIES } from '@/lib/countries'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

// Helper to get client name from quote request (handles both array and object from Supabase)
function getClientName(req: unknown): string {
  if (!req) return 'Unknown'
  if (Array.isArray(req)) {
    return req[0]?.client_name || 'Unknown'
  }
  return (req as { client_name: string }).client_name || 'Unknown'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get profile for currency
  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', user?.id)
    .single()

  const currencySymbol = getCurrencySymbol(profile?.currency || 'PLN')

  // Fetch all data in parallel
  const [
    { data: requests },
    { data: quotes },
    { data: invoices },
  ] = await Promise.all([
    supabase
      .from('qs_quote_requests')
      .select('id, status, client_name, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('qs_quotes')
      .select('id, status, total, total_gross, created_at, viewed_at, valid_until, qs_quote_requests(client_name)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('qs_invoices')
      .select('id, status, total_gross, client_name, created_at, due_date, paid_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false }),
  ])

  // Calculate stats
  const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0
  const sentQuotes = quotes?.filter(q => q.status === 'sent').length || 0
  const acceptedQuotes = quotes?.filter(q => q.status === 'accepted').length || 0
  const viewedQuotes = quotes?.filter(q => q.status === 'sent' && q.viewed_at).length || 0

  const unpaidInvoices = invoices?.filter(i => i.status !== 'paid') || []
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + (i.total_gross || 0), 0)

  const paidInvoices = invoices?.filter(i => i.status === 'paid') || []
  const paidTotal = paidInvoices.reduce((sum, i) => sum + (i.total_gross || 0), 0)

  const overdueInvoices = unpaidInvoices.filter(i => i.due_date && new Date(i.due_date) < new Date())
  const overdueTotal = overdueInvoices.reduce((sum, i) => sum + (i.total_gross || 0), 0)

  // Expiring quotes (valid_until within 2 days)
  const twoDaysFromNow = new Date()
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
  const expiringQuotes = quotes?.filter(q =>
    q.status === 'sent' &&
    q.valid_until &&
    new Date(q.valid_until) <= twoDaysFromNow &&
    new Date(q.valid_until) > new Date()
  ) || []

  // Recent activity (last 5 items combined)
  const recentActivity = [
    ...(requests?.slice(0, 5).map(r => ({
      type: 'request' as const,
      id: r.id,
      title: r.client_name,
      status: r.status,
      date: r.created_at,
      href: `/requests/${r.id}`,
    })) || []),
    ...(quotes?.slice(0, 5).map(q => ({
      type: 'quote' as const,
      id: q.id,
      title: getClientName(q.qs_quote_requests),
      status: q.viewed_at && q.status === 'sent' ? 'viewed' : q.status,
      date: q.created_at,
      href: `/quotes/${q.id}`,
      amount: q.total_gross || q.total,
    })) || []),
    ...(invoices?.slice(0, 5).map(i => ({
      type: 'invoice' as const,
      id: i.id,
      title: i.client_name,
      status: i.status,
      date: i.created_at,
      href: `/invoices/${i.id}`,
      amount: i.total_gross,
    })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    sent: 'bg-blue-500/20 text-blue-400',
    viewed: 'bg-purple-500/20 text-purple-400',
    accepted: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    draft: 'bg-slate-500/20 text-slate-400',
    paid: 'bg-green-500/20 text-green-400',
    quoted: 'bg-blue-500/20 text-blue-400',
  }

  const typeLabels: Record<string, string> = {
    request: 'Zapytanie',
    quote: 'Wycena',
    invoice: 'Faktura',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Przegląd Twojej działalności
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/requests" className="card hover:bg-slate-700/70 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingRequests}</p>
              <p className="text-slate-400 text-sm">Nowe zapytania</p>
            </div>
          </div>
        </Link>

        <Link href="/quotes?filter=sent" className="card hover:bg-slate-700/70 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{sentQuotes}</p>
              <p className="text-slate-400 text-sm">Wysłane wyceny</p>
              {viewedQuotes > 0 && (
                <p className="text-purple-400 text-xs">{viewedQuotes} obejrzanych</p>
              )}
            </div>
          </div>
        </Link>

        <Link href="/invoices?filter=sent" className="card hover:bg-slate-700/70 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-400">{currencySymbol}{unpaidTotal.toFixed(0)}</p>
              <p className="text-slate-400 text-sm">Do zapłaty</p>
              <p className="text-slate-500 text-xs">{unpaidInvoices.length} faktur</p>
            </div>
          </div>
        </Link>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{currencySymbol}{paidTotal.toFixed(0)}</p>
              <p className="text-slate-400 text-sm">Przychód</p>
              <p className="text-slate-500 text-xs">{paidInvoices.length} faktur</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(overdueInvoices.length > 0 || expiringQuotes.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {overdueInvoices.length > 0 && (
            <div className="card bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-red-400 font-semibold">Przeterminowane faktury ({overdueInvoices.length})</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">
                Łączna kwota: <span className="text-red-400 font-bold">{currencySymbol}{overdueTotal.toFixed(2)}</span>
              </p>
              <div className="space-y-2">
                {overdueInvoices.slice(0, 3).map(inv => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`} className="block text-sm text-slate-400 hover:text-white">
                    {inv.client_name} - {currencySymbol}{inv.total_gross?.toFixed(2)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {expiringQuotes.length > 0 && (
            <div className="card bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-orange-400 font-semibold">Wygasające wyceny ({expiringQuotes.length})</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">Wygasają w ciągu 2 dni</p>
              <div className="space-y-2">
                {expiringQuotes.slice(0, 3).map(q => (
                  <Link key={q.id} href={`/quotes/${q.id}`} className="block text-sm text-slate-400 hover:text-white">
                    {getClientName(q.qs_quote_requests)} - {currencySymbol}{(q.total_gross || q.total)?.toFixed(2)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <h3 className="text-slate-400 text-sm mb-2">Konwersja wycen</h3>
          <p className="text-3xl font-bold text-white">
            {quotes?.length ? Math.round((acceptedQuotes / quotes.length) * 100) : 0}%
          </p>
          <p className="text-slate-500 text-sm">{acceptedQuotes} z {quotes?.length || 0} zaakceptowanych</p>
        </div>
        <div className="card">
          <h3 className="text-slate-400 text-sm mb-2">Łącznie wycen</h3>
          <p className="text-3xl font-bold text-white">{quotes?.length || 0}</p>
          <p className="text-slate-500 text-sm">{acceptedQuotes} zaakceptowanych, {quotes?.filter(q => q.status === 'rejected').length || 0} odrzuconych</p>
        </div>
        <div className="card">
          <h3 className="text-slate-400 text-sm mb-2">Łącznie faktur</h3>
          <p className="text-3xl font-bold text-white">{invoices?.length || 0}</p>
          <p className="text-slate-500 text-sm">{paidInvoices.length} opłaconych, {unpaidInvoices.length} oczekujących</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6">Ostatnia aktywność</h2>

        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.href}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs w-16">{typeLabels[item.type]}</span>
                  <span className="text-white font-medium">{item.title}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[item.status] || statusColors.draft}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {'amount' in item && item.amount && (
                    <span className="text-slate-300 font-medium">{currencySymbol}{item.amount.toFixed(2)}</span>
                  )}
                  <span className="text-slate-500 text-sm">
                    {new Date(item.date).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <p>Brak aktywności. Zacznij od udostępnienia linku do zapytań klientom!</p>
          </div>
        )}
      </div>
    </div>
  )
}
