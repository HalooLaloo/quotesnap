import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

// TEMPORARY DEBUG — remove after checking
export async function GET() {
  try {
    const stripe = getStripe()
    const customerId = 'cus_U2mDvToFlgcG1z'

    // List ALL subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })

    const subs = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current_period_end: new Date(((sub as any).current_period_end as number) * 1000).toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trial_end: (sub as any).trial_end ? new Date(((sub as any).trial_end as number) * 1000).toISOString() : null,
      price_id: sub.items.data[0]?.price.id,
      cancel_at_period_end: sub.cancel_at_period_end,
    }))

    // Also check the customer
    const customer = await stripe.customers.retrieve(customerId)

    return NextResponse.json({
      customer_id: customerId,
      customer_email: 'email' in customer ? customer.email : null,
      customer_deleted: 'deleted' in customer ? customer.deleted : false,
      subscriptions_count: subs.length,
      subscriptions: subs,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
