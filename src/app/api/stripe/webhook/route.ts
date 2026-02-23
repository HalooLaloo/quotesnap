import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { emailLayout } from '@/lib/emailTemplate'
import Stripe from 'stripe'

function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for webhook')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Helper to safely get subscription end date
function getSubscriptionEndDate(sub: Stripe.Subscription): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endTimestamp = (sub as any).current_period_end as number
  return new Date(endTimestamp * 1000).toISOString()
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          await supabase
            .from('profiles')
            .update({
              stripe_subscription_id: sub.id,
              stripe_price_id: sub.items.data[0].price.id,
              subscription_status: sub.status,
              subscription_current_period_end: getSubscriptionEndDate(sub),
            })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: sub.status,
              stripe_price_id: sub.items.data[0]?.price.id || null,
              subscription_current_period_end: getSubscriptionEndDate(sub),
            })
            .eq('id', userId)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoiceSubscription = (invoice as any).subscription as string | null
        if (invoiceSubscription) {
          const sub = await stripe.subscriptions.retrieve(
            invoiceSubscription
          )
          const userId = sub.metadata?.userId

          if (userId) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_current_period_end: getSubscriptionEndDate(sub),
              })
              .eq('id', userId)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoiceSubscription = (invoice as any).subscription as string | null
        if (invoiceSubscription) {
          const sub = await stripe.subscriptions.retrieve(
            invoiceSubscription
          )
          const userId = sub.metadata?.userId

          if (userId) {
            await supabase
              .from('profiles')
              .update({ subscription_status: 'past_due' })
              .eq('id', userId)

            // Send payment failed email
            if (process.env.RESEND_API_KEY) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', userId)
                .single()

              let userEmail = profile?.email
              if (!userEmail) {
                const { data: userData } = await supabase.auth.admin.getUserById(userId)
                userEmail = userData?.user?.email
              }

              if (userEmail) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brickquote.app'
                const resend = new Resend(process.env.RESEND_API_KEY)
                await resend.emails.send({
                  from: 'BrickQuote <contact@brickquote.app>',
                  to: userEmail,
                  subject: 'Payment failed — update your card to keep access',
                  html: emailLayout({
                    accentColor: '#ef4444',
                    title: 'Payment Failed',
                    content: `
                      <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                        We couldn&rsquo;t process your latest payment. Your account access has been paused until the payment is resolved.
                      </p>
                      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="color: #991b1b; font-size: 14px; margin: 0;">
                          <strong>Your data is safe.</strong> Update your payment method and your access will be restored instantly.
                        </p>
                      </div>
                      <a href="${appUrl}/subscribe" style="display: block; background: #2563eb; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                        Update Payment Method
                      </a>
                      <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 16px 0 0 0;">
                        We&rsquo;ll also retry the charge automatically in a few days.
                      </p>`,
                  }),
                }).catch(() => {
                  // Non-critical — don't fail the webhook
                })
              }
            }
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
