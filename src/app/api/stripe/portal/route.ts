import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getPortalConfigId } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

async function createPortalSession(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const origin = request.headers.get('origin') || request.nextUrl.origin || 'https://brickquote.app'
  const configId = await getPortalConfigId()
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/settings`,
    ...(configId && { configuration: configId }),
  })
}

// POST — returns JSON (existing API)
export async function POST(request: NextRequest) {
  try {
    const session = await createPortalSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}

// GET — redirects directly (for <a href> links, works on all platforms)
export async function GET(request: NextRequest) {
  try {
    const session = await createPortalSession(request)
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.redirect(session.url)
  } catch (error) {
    console.error('Stripe portal redirect error:', error)
    return NextResponse.redirect(new URL('/settings?error=portal', request.url))
  }
}
