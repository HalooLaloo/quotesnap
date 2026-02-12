import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { escapeHtml } from '@/lib/escapeHtml'
import { emailUnsubscribeFooter } from '@/lib/emailFooter'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })
    }

    // Get invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from('qs_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from('qs_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    // Send email notification to worker (yourself)
    if (process.env.RESEND_API_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)

      // Get worker email and notification preferences
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const { data: workerProfile } = await serviceClient
        .from('profiles')
        .select('email, email_notifications')
        .eq('id', user.id)
        .single()

      let workerEmail: string | undefined = workerProfile?.email

      if (!workerEmail) {
        try {
          const { data: userData } = await serviceClient.auth.admin.getUserById(user.id)
          workerEmail = userData?.user?.email
        } catch {
          // no email found
        }
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brickquote.app'

      if (workerEmail && workerProfile?.email_notifications !== false) {
        await resend.emails.send({
          from: 'BrickQuote <contact@brickquote.app>',
          to: workerEmail,
          subject: `Invoice paid - ${invoice.client_name}`,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
              <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: #22c55e; padding: 24px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">Invoice Paid!</h1>
                </div>
                <div style="padding: 32px;">
                  <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                    Invoice <strong>${invoice.invoice_number}</strong> for client <strong>${escapeHtml(invoice.client_name || 'Client')}</strong> has been marked as paid.
                  </p>

                  <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
                    <p style="color: #166534; font-size: 24px; font-weight: bold; margin: 0; text-align: center;">
                      +${invoice.total_gross?.toFixed(2) || invoice.total_net?.toFixed(2)}
                    </p>
                  </div>

                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://brickquote.app'}/invoices/${invoice.id}" style="display: block; background: #22c55e; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                    View Invoice
                  </a>
                </div>
                <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote</p>
                  ${emailUnsubscribeFooter(user.id, appUrl)}
                </div>
              </div>
            </body>
            </html>
          `,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark invoice paid error:', error)
    return NextResponse.json({ error: 'Failed to mark invoice as paid' }, { status: 500 })
  }
}
