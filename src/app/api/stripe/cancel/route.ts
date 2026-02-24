import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { reason, details } = body as { reason?: string; details?: string }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    // Cancel at period end (user keeps access until end of billing cycle)
    const subscription = await getStripe().subscriptions.update(
      profile.stripe_subscription_id,
      {
        cancel_at_period_end: true,
        metadata: {
          cancel_reason: reason || '',
          cancel_details: details || '',
          canceled_at: new Date().toISOString(),
        },
      }
    )

    // Don't change subscription_status locally — user keeps full access until period end.
    // Stripe webhook (customer.subscription.updated) will sync the status automatically.
    // The subscription.status from Stripe remains 'active' with cancel_at_period_end=true.

    return NextResponse.json({
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
