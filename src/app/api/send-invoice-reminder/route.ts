import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { COUNTRIES, formatDate } from '@/lib/countries'

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('qs_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status !== 'sent') {
      return NextResponse.json(
        { error: 'Can only send reminders for sent invoices' },
        { status: 400 }
      )
    }

    if (!invoice.client_email) {
      return NextResponse.json(
        { error: 'No client email address' },
        { status: 400 }
      )
    }

    // Get contractor profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, phone, bank_name, bank_account, bank_routing, country')
      .eq('id', user.id)
      .single()

    const contractorName = profile?.company_name || profile?.full_name || 'Contractor'
    const countryCode = profile?.country || 'US'
    const countryConfig = COUNTRIES[countryCode] || COUNTRIES.US
    const currencySymbol = getCurrencySymbol(invoice.currency || 'USD')
    const invoiceUrl = `${protocol}://${host}/invoice/${invoice.token}`

    // Bank details (invoice-level with profile fallback)
    const bankName = invoice.bank_name || profile?.bank_name
    const bankAccount = invoice.bank_account || profile?.bank_account
    const bankRouting = invoice.bank_routing || profile?.bank_routing

    // Calculate overdue info
    let overdueText = ''
    if (invoice.due_date) {
      const dueDate = new Date(invoice.due_date)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays > 0) {
        overdueText = `This invoice was due on <strong>${formatDate(invoice.due_date, countryCode)}</strong> — <strong>${diffDays} day${diffDays > 1 ? 's' : ''} ago</strong>.`
      } else {
        overdueText = `This invoice is due on <strong>${formatDate(invoice.due_date, countryCode)}</strong>.`
      }
    }

    // Bank details HTML
    const bankHtml = (bankName || bankAccount || bankRouting) ? `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 14px 0; color: #166534; font-size: 15px; font-weight: 700;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${bankName ? `<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 100px;">Bank</td><td style="padding: 4px 0; color: #374151; font-size: 14px; font-weight: 600;">${bankName}</td></tr>` : ''}
          ${bankRouting ? `<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">${countryConfig.bankRoutingLabel}</td><td style="padding: 4px 0; color: #374151; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace;">${bankRouting}</td></tr>` : ''}
          ${bankAccount ? `<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Account</td><td style="padding: 4px 0; color: #374151; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace;">${bankAccount}</td></tr>` : ''}
        </table>
      </div>
    ` : ''

    const resend = new Resend(process.env.RESEND_API_KEY)

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Payment Reminder</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${invoice.invoice_number}</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
              Hi <strong>${invoice.client_name || 'there'}</strong>,
            </p>
            <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px 0;">
              This is a friendly reminder that invoice <strong>${invoice.invoice_number}</strong> from <strong>${contractorName}</strong> is awaiting payment.
            </p>

            ${overdueText ? `
              <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #9a3412; font-size: 14px;">${overdueText}</p>
              </div>
            ` : ''}

            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <p style="color: #92400e; font-size: 13px; margin: 0 0 4px 0;">Amount Due</p>
              <p style="color: #78350f; font-size: 28px; font-weight: 700; margin: 0;">
                ${currencySymbol}${invoice.total_gross?.toFixed(2)}
              </p>
            </div>

            ${bankHtml}

            <div style="text-align: center; margin: 32px 0 16px 0;">
              <a href="${invoiceUrl}" style="display: inline-block; background: #f97316; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                View Invoice &amp; Pay
              </a>
            </div>

            ${profile?.phone ? `
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 16px 0 0 0;">
                Questions? Contact ${contractorName}: <a href="tel:${profile.phone}" style="color: #3b82f6;">${profile.phone}</a>
              </p>
            ` : ''}
          </div>
          <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote - Payment Reminder</p>
          </div>
        </div>
      </body>
      </html>
    `

    const { error: sendError } = await resend.emails.send({
      from: 'BrickQuote <contact@brickquote.app>',
      to: invoice.client_email,
      subject: `Payment reminder — ${invoice.invoice_number} from ${contractorName}`,
      html: emailHtml,
    })

    if (sendError) {
      console.error('Resend error:', sendError)
      return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
    }

    // Update reminder tracking
    await supabase
      .from('qs_invoices')
      .update({
        reminder_sent_at: new Date().toISOString(),
        reminder_count: (invoice.reminder_count || 0) + 1,
      })
      .eq('id', invoice.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send reminder API error:', error)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }
}
