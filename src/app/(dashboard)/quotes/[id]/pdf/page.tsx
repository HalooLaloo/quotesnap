import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function QuotePDFPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: quote } = await supabase
    .from('qs_quotes')
    .select('id, qs_quote_requests(client_name)')
    .eq('id', id)
    .eq('user_id', user?.id)
    .single()

  if (!quote) {
    notFound()
  }

  const clientName = (quote.qs_quote_requests as { client_name?: string })?.client_name || 'Client'

  return (
    <div className="p-4 md:p-8">
      <Link
        href={`/quotes/${id}`}
        className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Quote
      </Link>

      <div className="card mt-4">
        <h1 className="text-xl font-bold text-white mb-2">
          PDF Quote — {clientName}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Your PDF is ready. Tap the button below to view or download it.
        </p>

        <div className="space-y-3">
          <a
            href={`/api/export-pdf?id=${id}`}
            className="btn-primary w-full text-center flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </a>

          <p className="text-slate-500 text-xs text-center">
            If the button above doesn&apos;t work, long-press it and choose &quot;Open in browser&quot; or &quot;Save link&quot;.
          </p>
        </div>
      </div>
    </div>
  )
}
