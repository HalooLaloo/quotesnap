import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_PROMO_CODES: Record<string, string> = {
  BETATEST: 'beta_tester',
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json() as { code: string }
    const normalizedCode = (code || '').trim().toUpperCase()

    if (!normalizedCode || !VALID_PROMO_CODES[normalizedCode]) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 })
    }

    // Check current status — don't override active Stripe subscriptions
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing') {
      return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 })
    }

    // Activate via promo — no Stripe involved
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'active' })
      .eq('id', user.id)

    if (updateError) {
      console.error('Promo activation error:', updateError)
      return NextResponse.json({ error: 'Failed to activate' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Promo error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
