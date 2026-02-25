import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

// TEMPORARY DEBUG — remove after checking
export async function GET() {
  try {
    const stripe = getStripe()
    const customerId = 'cus_U2mDvToFlgcG1z'

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subs = subscriptions.data.map((sub: any) => ({
      id: sub.id,
      status: sub.status,
      current_period_end: sub.current_period_end,
      current_period_end_date: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      trial_end: sub.trial_end,
      trial_end_date: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      price_id: sub.items?.data?.[0]?.price?.id,
      cancel_at_period_end: sub.cancel_at_period_end,
      created: sub.created ? new Date(sub.created * 1000).toISOString() : null,
    }))

    const customer = await stripe.customers.retrieve(customerId)

    return NextResponse.json({
      customer_id: customerId,
      customer_email: 'email' in customer ? customer.email : null,
      deleted: 'deleted' in customer ? customer.deleted : false,
      count: subs.length,
      subs,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
