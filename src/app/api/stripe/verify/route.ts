import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status, stripe_price_id, subscription_current_period_end')
      .eq('id', user.id)
      .single()

    // Already active/trialing AND has full data — return cached DB values
    if (
      (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing') &&
      profile?.subscription_current_period_end
    ) {
      return NextResponse.json({
        status: profile.subscription_status,
        period_end: profile.subscription_current_period_end,
        price_id: profile.stripe_price_id,
      })
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ status: 'inactive' })
    }

    // Check Stripe directly — handles webhook failures, stale data, etc.
    const subscriptions = await getStripe().subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 1,
    })

    const sub = subscriptions.data[0]
    if (!sub) {
      return NextResponse.json({ status: 'inactive' })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSub = sub as any
    // Use current_period_end, fall back to trial_end for trial subscriptions
    const endTimestamp = rawSub.current_period_end || rawSub.trial_end
    const periodEnd = endTimestamp ? new Date(endTimestamp * 1000).toISOString() : null
    const priceId = sub.items.data[0]?.price.id || null

    // Update profile with real Stripe data
    await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        subscription_status: sub.status,
        ...(periodEnd && { subscription_current_period_end: periodEnd }),
      })
      .eq('id', user.id)

    return NextResponse.json({
      status: sub.status,
      period_end: periodEnd,
      price_id: priceId,
    })
  } catch (error) {
    console.error('Verify subscription error:', error)
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
  }
}
