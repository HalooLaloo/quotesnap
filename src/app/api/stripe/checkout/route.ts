import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS, PlanType } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

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

    const selectedPlan = PLANS[plan]

    if (!selectedPlan.priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
    }

    // Get or create profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    // Create profile if it doesn't exist
    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email })
        .select('stripe_customer_id')
        .single()
      profile = newProfile
    }

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session with 3-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      success_url: `${request.headers.get('origin')}/requests?checkout=success`,
      cancel_url: `${request.headers.get('origin')}/subscribe`,
      metadata: { userId: user.id },
      subscription_data: {
        metadata: { userId: user.id },
        ...(selectedPlan.trialDays > 0 && { trial_period_days: selectedPlan.trialDays }),
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
