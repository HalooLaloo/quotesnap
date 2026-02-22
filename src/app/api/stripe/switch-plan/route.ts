import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, PlanType } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json() as { plan: PlanType }

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const newPlan = PLANS[plan]
    if (!newPlan.priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_price_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    // Already on the requested plan
    if (profile.stripe_price_id === newPlan.priceId) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
    }

    // Get current subscription to find the item ID
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) {
      return NextResponse.json({ error: 'Subscription item not found' }, { status: 500 })
    }

    // Update subscription with new price (Stripe handles proration automatically)
    const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [{ id: itemId, price: newPlan.priceId }],
      proration_behavior: 'create_prorations',
    })

    // Update local profile
    await supabase
      .from('profiles')
      .update({
        stripe_price_id: newPlan.priceId,
        subscription_status: updated.status,
      })
      .eq('id', user.id)

    return NextResponse.json({
      status: updated.status,
      plan: plan,
    })
  } catch (error) {
    console.error('Switch plan error:', error)
    return NextResponse.json(
      { error: 'Failed to switch plan' },
      { status: 500 }
    )
  }
}
