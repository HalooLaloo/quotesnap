import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AcceptedQuotes } from './AcceptedQuotes'
import { COUNTRIES } from '@/lib/countries'

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoices } = await supabase
    .from('qs_invoices')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  // Get accepted quotes that haven't been invoiced yet
  const { data: acceptedQuotes } = await supabase
    .from('qs_quotes')
    .select(`
      id,
      total_gross,
      total,
      status,
      created_at,
      currency,
      qs_quote_requests (
        client_name,
        client_email
      )
    `)
    .eq('user_id', user?.id)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })

  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-400',
    sent: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoices</h1>
          <p className="text-slate-400 mt-1">
            Create and manage invoices for completed work.
          </p>
        </div>
        <Link href="/invoices/new" className="btn-primary">
          + New Invoice
        </Link>
      </div>

      {/* Accepted Quotes Section */}
      <AcceptedQuotes quotes={acceptedQuotes || []} />

      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6">
          All Invoices ({invoices?.length || 0})
        </h2>

        {invoices && invoices.length > 0 ? (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-medium">
                      {invoice.invoice_number}
                    </p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      statusColors[invoice.status as keyof typeof statusColors] || statusColors.draft
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {invoice.client_name} • <span className="text-white font-medium">{getCurrencySymbol(invoice.currency || 'PLN')}{invoice.total_gross?.toFixed(2) || '0.00'}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <span className="text-slate-500 text-sm block">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </span>
                    {invoice.due_date && (
                      <span className="text-slate-600 text-xs">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/invoices/${invoice.id}`}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">No invoices yet</h3>
            <p className="text-slate-400 mb-4">Create invoices from accepted quotes or start fresh.</p>
            <Link href="/invoices/new" className="btn-primary">
              Create Invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
