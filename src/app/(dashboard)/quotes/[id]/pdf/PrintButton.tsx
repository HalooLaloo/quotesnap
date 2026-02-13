'use client'

export function PrintButton({ clientName, quoteId }: { clientName: string; quoteId: string }) {
  return (
    <form action="/api/export-pdf" method="GET">
      <input type="hidden" name="id" value={quoteId} />
      <button
        type="submit"
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download PDF
      </button>
    </form>
  )
}
