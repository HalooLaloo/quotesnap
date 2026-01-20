import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CollapsibleDescription } from '@/app/(dashboard)/quotes/[id]/CollapsibleDescription'
import { ArchiveButton } from '@/components/ArchiveButton'

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: request } = await supabase
    .from('qs_quote_requests')
    .select('*')
    .eq('id', id)
    .eq('contractor_id', user?.id)
    .single()

  if (!request) {
    notFound()
  }

  const statusColors: Record<string, string> = {
    new: 'bg-yellow-500/20 text-yellow-400',
    reviewing: 'bg-blue-500/20 text-blue-400',
    quoted: 'bg-purple-500/20 text-purple-400',
    accepted: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    archived: 'bg-slate-500/20 text-slate-400',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/requests"
          className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Requests
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold text-white">{request.client_name}</h1>
            <p className="text-slate-400 mt-1">
              Submitted on {new Date(request.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status] || 'bg-slate-500/20 text-slate-400'}`}>
            {request.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Project Description</h2>
            <CollapsibleDescription description={request.description} />
          </div>

          {/* Photos */}
          {request.photos && request.photos.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">
                Photos ({request.photos.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.photos.map((photo: string, index: number) => (
                  <a
                    key={index}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="rounded-lg object-cover aspect-square w-full"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
            <div className="space-y-3">
              {request.client_email && (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${request.client_email}`} className="text-blue-400 hover:text-blue-300">
                    {request.client_email}
                  </a>
                </div>
              )}
              {request.client_phone && (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${request.client_phone}`} className="text-blue-400 hover:text-blue-300">
                    {request.client_phone}
                  </a>
                </div>
              )}
              {request.address && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-slate-300">{request.address}</span>
                </div>
              )}
              {!request.client_email && !request.client_phone && !request.address && (
                <p className="text-slate-500 text-sm">No contact information provided</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
            <div className="space-y-3">
              {(request.status === 'new' || request.status === 'quoted' || request.status === 'reviewing') && (
                <Link
                  href={`/quotes/new?request=${request.id}`}
                  className="btn-primary w-full text-center block"
                >
                  {request.status === 'new' ? 'Create Quote' : 'Create New Quote'}
                </Link>
              )}
              {request.status === 'quoted' && (
                <p className="text-slate-400 text-sm text-center">Quote sent - waiting for client response</p>
              )}
              {request.status === 'accepted' && (
                <>
                  <p className="text-green-400 text-sm text-center mb-2">Quote accepted!</p>
                  <Link
                    href={`/quotes/new?request=${request.id}`}
                    className="btn-secondary w-full text-center block"
                  >
                    Create Another Quote
                  </Link>
                </>
              )}
              {request.status === 'archived' && (
                <p className="text-slate-400 text-sm text-center mb-2">This request is archived</p>
              )}

              <div className="pt-3 border-t border-slate-700">
                <ArchiveButton
                  requestId={request.id}
                  isArchived={request.status === 'archived'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
