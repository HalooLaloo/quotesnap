import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user) {
      console.error('[portal] Auth failed:', authError?.message)
      return NextResponse.json({ error: `Unauthorized: ${authError?.message || 'no user'}` }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[portal] Profile query error:', profileError.message)
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: `No stripe_customer_id for user ${user.id}` },
        { status: 400 }
      )
    }

    const origin = request.headers.get('origin') || 'https://brickquote.app'
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[portal] Stripe error:', msg)
    return NextResponse.json(
      { error: `Portal session failed: ${msg}` },
      { status: 500 }
    )
  }
}
