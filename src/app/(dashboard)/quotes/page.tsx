import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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

      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6">
          All Quotes ({quotes?.length || 0})
        </h2>

        {quotes && quotes.length > 0 ? (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-medium">
                      {quote.qs_quote_requests?.client_name || 'Unknown Client'}
                    </p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      quote.status === 'draft' ? 'bg-slate-500/20 text-slate-400' :
                      quote.status === 'sent' && quote.viewed_at ? 'bg-purple-500/20 text-purple-400' :
                      quote.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                      quote.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {quote.status === 'sent' && quote.viewed_at ? 'viewed' : quote.status}
                    </span>
                    {quote.viewed_at && quote.status === 'sent' && (
                      <span className="flex items-center gap-1 text-purple-400 text-xs" title={`Viewed on ${new Date(quote.viewed_at).toLocaleString()}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm">
                    Total: <span className="text-white font-medium">{quote.total?.toFixed(2) || '0.00'} PLN</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-slate-500 text-sm">
                    {new Date(quote.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="btn-secondary text-sm"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">No quotes yet</h3>
            <p className="text-slate-400">Create quotes from incoming requests.</p>
          </div>
        )}
      </div>
    </div>
  )
}
