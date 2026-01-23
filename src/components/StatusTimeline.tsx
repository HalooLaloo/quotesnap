interface TimelineStep {
  label: string
  date: string | null
  status: 'completed' | 'current' | 'pending'
}

interface StatusTimelineProps {
  steps: TimelineStep[]
}

export function StatusTimeline({ steps }: StatusTimelineProps) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-4">Status History</h2>
      <div className="relative">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1

          // Determine colors based on status
          const dotColor =
            step.status === 'completed' ? 'bg-green-500' :
            step.status === 'current' ? 'bg-blue-500' :
            'bg-slate-600'

          const lineColor =
            step.status === 'completed' ? 'bg-green-500' :
            'bg-slate-600'

          const textColor =
            step.status === 'completed' ? 'text-green-400' :
            step.status === 'current' ? 'text-blue-400' :
            'text-slate-500'

          const labelColor =
            step.status === 'pending' ? 'text-slate-500' : 'text-white'

          return (
            <div key={index} className="flex gap-4">
              {/* Timeline column */}
              <div className="flex flex-col items-center">
                {/* Dot */}
                <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 ring-slate-800`} />
                {/* Line */}
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[32px] ${lineColor}`} />
                )}
              </div>

              {/* Content column */}
              <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                <p className={`font-medium ${labelColor}`}>
                  {step.label}
                </p>
                {step.date ? (
                  <p className={`text-sm ${textColor}`}>
                    {new Date(step.date).toLocaleDateString('pl-PL', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">—</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Helper function to generate quote timeline steps
export function getQuoteTimelineSteps(quote: {
  created_at: string
  sent_at: string | null
  viewed_at: string | null
  accepted_at: string | null
  status: string
}): TimelineStep[] {
  const steps: TimelineStep[] = []

  // Created
  steps.push({
    label: 'Created',
    date: quote.created_at,
    status: 'completed',
  })

  // Sent
  if (quote.sent_at) {
    steps.push({
      label: 'Sent',
      date: quote.sent_at,
      status: 'completed',
    })
  } else if (quote.status === 'draft') {
    steps.push({
      label: 'Sent',
      date: null,
      status: quote.status === 'draft' ? 'pending' : 'completed',
    })
  }

  // Viewed
  if (quote.viewed_at) {
    steps.push({
      label: 'Viewed by client',
      date: quote.viewed_at,
      status: 'completed',
    })
  } else if (quote.sent_at && quote.status === 'sent') {
    steps.push({
      label: 'Viewed by client',
      date: null,
      status: 'pending',
    })
  }

  // Accepted/Rejected
  if (quote.status === 'accepted' && quote.accepted_at) {
    steps.push({
      label: 'Accepted',
      date: quote.accepted_at,
      status: 'completed',
    })
  } else if (quote.status === 'rejected') {
    steps.push({
      label: 'Rejected',
      date: null, // We don't track rejected_at
      status: 'completed',
    })
  } else if (quote.status === 'sent') {
    steps.push({
      label: 'Response',
      date: null,
      status: 'pending',
    })
  }

  // Mark the last completed step as current if there are pending steps after it
  const lastCompletedIndex = steps.map(s => s.status).lastIndexOf('completed')
  const hasPendingAfter = steps.slice(lastCompletedIndex + 1).some(s => s.status === 'pending')
  if (lastCompletedIndex >= 0 && hasPendingAfter) {
    steps[lastCompletedIndex].status = 'current'
  }

  return steps
}

// Helper function to generate invoice timeline steps
export function getInvoiceTimelineSteps(invoice: {
  created_at: string
  sent_at: string | null
  paid_at: string | null
  status: string
}): TimelineStep[] {
  const steps: TimelineStep[] = []

  // Created
  steps.push({
    label: 'Created',
    date: invoice.created_at,
    status: 'completed',
  })

  // Sent
  if (invoice.sent_at) {
    steps.push({
      label: 'Sent',
      date: invoice.sent_at,
      status: 'completed',
    })
  } else if (invoice.status === 'draft') {
    steps.push({
      label: 'Sent',
      date: null,
      status: 'pending',
    })
  }

  // Paid
  if (invoice.paid_at) {
    steps.push({
      label: 'Paid',
      date: invoice.paid_at,
      status: 'completed',
    })
  } else if (invoice.status !== 'draft') {
    steps.push({
      label: 'Paid',
      date: null,
      status: 'pending',
    })
  }

  // Mark the last completed step as current if there are pending steps after it
  const lastCompletedIndex = steps.map(s => s.status).lastIndexOf('completed')
  const hasPendingAfter = steps.slice(lastCompletedIndex + 1).some(s => s.status === 'pending')
  if (lastCompletedIndex >= 0 && hasPendingAfter) {
    steps[lastCompletedIndex].status = 'current'
  }

  return steps
}
