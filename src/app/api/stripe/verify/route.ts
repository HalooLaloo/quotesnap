import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
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
      .select('stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single()

    // Already active — no need to check Stripe
    if (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing') {
      return NextResponse.json({ status: profile.subscription_status })
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ status: 'inactive' })
    }

    // Check Stripe directly for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 1,
    })

    const sub = subscriptions.data[0]
    if (!sub) {
      return NextResponse.json({ status: 'inactive' })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const endTimestamp = (sub as any).current_period_end as number

    // Update profile with real Stripe data
    await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: sub.id,
        stripe_price_id: sub.items.data[0]?.price.id || null,
        subscription_status: sub.status,
        subscription_current_period_end: new Date(endTimestamp * 1000).toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({ status: sub.status })
  } catch (error) {
    console.error('Verify subscription error:', error)
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
  }
}
