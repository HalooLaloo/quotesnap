import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { COUNTRIES } from '@/lib/countries'

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find invoice by token
    const { data: invoice, error: invoiceError } = await supabase
      .from('qs_invoices')
      .select('*')
      .eq('token', token)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status !== 'sent') {
      return NextResponse.json({ error: 'Invoice cannot be marked as paid' }, { status: 400 })
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from('qs_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    // Send notification email to contractor
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)

      let contractorEmail: string | undefined
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(invoice.user_id)
        contractorEmail = userData?.user?.email
      } catch {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', invoice.user_id)
          .single()
        contractorEmail = profile?.email
      }

      if (contractorEmail) {
        const currencySymbol = getCurrencySymbol(invoice.currency || 'USD')
        const clientName = invoice.client_name || 'Client'

        await resend.emails.send({
          from: 'BrickQuote <contact@brickquote.app>',
          to: contractorEmail,
          subject: `Payment received — ${invoice.invoice_number}`,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
              <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: #22c55e; padding: 24px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">Payment Confirmed!</h1>
                </div>
                <div style="padding: 32px;">
                  <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                    <strong>${clientName}</strong> has confirmed payment for invoice <strong>${invoice.invoice_number}</strong>.
                  </p>
                  <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                    <p style="color: #166534; font-size: 24px; font-weight: 700; margin: 0; text-align: center;">
                      ${currencySymbol}${invoice.total_gross?.toFixed(2)}
                    </p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    The invoice has been marked as paid in your dashboard.
                  </p>
                </div>
                <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote Notification</p>
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
    console.error('Mark paid API error:', error)
    return NextResponse.json({ error: 'Failed to mark as paid' }, { status: 500 })
  }
}
