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

    const body = await request.json() as { plan: PlanType }
    const plan = body?.plan

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const selectedPlan = PLANS[plan]

    if (!selectedPlan.priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for plan: ${plan}. Env STRIPE_MONTHLY_PRICE_ID=${process.env.STRIPE_MONTHLY_PRICE_ID ? 'set' : 'MISSING'}` },
        { status: 500 }
      )
    }

    // Get or create profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    // Create profile if it doesn't exist
    if (!profile) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email })
        .select('stripe_customer_id')
        .single()

      if (insertError) {
        console.error('Profile insert error:', insertError)
        // Profile might already exist but select failed - try fetching again
        const { data: retryProfile } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single()
        profile = retryProfile
      } else {
        profile = newProfile
      }
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
    const origin = request.headers.get('origin') || 'https://www.brickquote.app'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      success_url: `${origin}/requests?checkout=success`,
      cancel_url: `${origin}/subscribe`,
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
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Checkout failed: ${message}` },
      { status: 500 }
    )
  }
}
