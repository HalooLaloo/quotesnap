import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    // Remove cancel_at_period_end (reactivate)
    const subscription = await getStripe().subscriptions.update(
      profile.stripe_subscription_id,
      { cancel_at_period_end: false }
    )

    // Update local status
    await supabase
      .from('profiles')
      .update({ subscription_status: subscription.status })
      .eq('id', user.id)

    return NextResponse.json({
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
  } catch (error) {
    console.error('Resume subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 }
    )
  }
}
