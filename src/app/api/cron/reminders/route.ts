import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { COUNTRIES, formatDate } from '@/lib/countries'
import { escapeHtml } from '@/lib/escapeHtml'
import { emailUnsubscribeFooter } from '@/lib/emailFooter'

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Helper to get client name from quote request (handles both array and object from Supabase)
function getClientName(req: unknown): string {
  if (!req) return 'Unknown'
  if (Array.isArray(req)) {
    return req[0]?.client_name || 'Unknown'
  }
  return (req as { client_name: string }).client_name || 'Unknown'
}

// This endpoint is called by Vercel Cron Jobs
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 8 * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for security)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.RESEND_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const resend = new Resend(process.env.RESEND_API_KEY)

    const results = {
      expiredQuotes: 0,
      newRequests: 0,
      overdueInvoices: 0,
      expiringQuotes: 0,
      clientReminders: 0,
      errors: [] as string[],
    }

    // Auto-expire quotes past their valid_until date
    const { data: expiredQuotes } = await supabase
      .from('qs_quotes')
      .update({ status: 'expired' })
      .eq('status', 'sent')
      .lt('valid_until', new Date().toISOString())
      .select('id')

    results.expiredQuotes = expiredQuotes?.length || 0

    // Get all users (only those with email notifications enabled)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, email_notifications')
      .neq('email_notifications', false)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, message: 'No users found' })
    }

    const now = new Date()
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brickquote.app'

    for (const profile of profiles) {
      if (!profile.email) continue

      // Check for unanswered new requests (older than 24h)
      const { data: newRequests } = await supabase
        .from('qs_quote_requests')
        .select('id, client_name, description, created_at')
        .eq('contractor_id', profile.id)
        .eq('status', 'new')
        .lt('created_at', oneDayAgo.toISOString())

      if (newRequests && newRequests.length > 0) {
        try {
          await resend.emails.send({
            from: 'BrickQuote <contact@brickquote.app>',
            to: profile.email,
            subject: `You have ${newRequests.length} unanswered request${newRequests.length > 1 ? 's' : ''}`,
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <div style="background: #3b82f6; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">New Requests Waiting</h1>
                  </div>
                  <div style="padding: 32px;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                      You have <strong>${newRequests.length}</strong> client request${newRequests.length > 1 ? 's' : ''} waiting for a quote.
                    </p>

                    <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                      ${newRequests.slice(0, 5).map(req => {
                        const age = Math.floor((now.getTime() - new Date(req.created_at).getTime()) / (1000 * 60 * 60))
                        const ageText = age >= 48 ? `${Math.floor(age / 24)}d ago` : `${age}h ago`
                        return `
                          <p style="color: #1e40af; font-size: 14px; margin: 8px 0;">
                            <strong>${escapeHtml(req.client_name)}</strong> - ${ageText}
                          </p>
                        `
                      }).join('')}
                      ${newRequests.length > 5 ? `<p style="color: #6b7280; font-size: 12px; margin: 8px 0;">...and ${newRequests.length - 5} more</p>` : ''}
                    </div>

                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
                      Quick responses lead to more accepted quotes. Don't keep your clients waiting!
                    </p>

                    <a href="${appUrl}/requests" style="display: block; background: #3b82f6; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                      View Requests
                    </a>
                  </div>
                  <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote - Reminder</p>
                    ${emailUnsubscribeFooter(profile.id, appUrl)}
                  </div>
                </div>
              </body>
              </html>
            `,
          })
          results.newRequests += newRequests.length
        } catch {
          results.errors.push(`Failed to send new requests email to ${profile.email}`)
        }
      }

      // Check for overdue invoices
      const { data: overdueInvoices } = await supabase
        .from('qs_invoices')
        .select('id, invoice_number, client_name, total_gross, due_date')
        .eq('user_id', profile.id)
        .neq('status', 'paid')
        .lt('due_date', now.toISOString())

      if (overdueInvoices && overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum, i) => sum + (i.total_gross || 0), 0)

        try {
          await resend.emails.send({
            from: 'BrickQuote <contact@brickquote.app>',
            to: profile.email,
            subject: `You have ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}`,
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <div style="background: #ef4444; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Overdue Invoices</h1>
                  </div>
                  <div style="padding: 32px;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                      You have <strong>${overdueInvoices.length}</strong> overdue invoice${overdueInvoices.length > 1 ? 's' : ''} totaling <strong>${totalOverdue.toFixed(2)}</strong>.
                    </p>

                    <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                      ${overdueInvoices.slice(0, 5).map(inv => `
                        <p style="color: #991b1b; font-size: 14px; margin: 8px 0;">
                          <strong>${inv.invoice_number}</strong> - ${escapeHtml(inv.client_name)}: ${inv.total_gross?.toFixed(2)}
                        </p>
                      `).join('')}
                      ${overdueInvoices.length > 5 ? `<p style="color: #6b7280; font-size: 12px; margin: 8px 0;">...and ${overdueInvoices.length - 5} more</p>` : ''}
                    </div>

                    <a href="${appUrl}/invoices" style="display: block; background: #ef4444; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                      View Invoices
                    </a>
                  </div>
                  <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote - Reminder</p>
                    ${emailUnsubscribeFooter(profile.id, appUrl)}
                  </div>
                </div>
              </body>
              </html>
            `,
          })
          results.overdueInvoices += overdueInvoices.length
        } catch {
          results.errors.push(`Failed to send overdue email to ${profile.email}`)
        }
      }

      // Check for expiring quotes (within 2 days)
      const { data: expiringQuotes } = await supabase
        .from('qs_quotes')
        .select('id, total, total_gross, valid_until, qs_quote_requests(client_name)')
        .eq('user_id', profile.id)
        .eq('status', 'sent')
        .gt('valid_until', now.toISOString())
        .lte('valid_until', twoDaysFromNow.toISOString())

      if (expiringQuotes && expiringQuotes.length > 0) {
        try {
          await resend.emails.send({
            from: 'BrickQuote <contact@brickquote.app>',
            to: profile.email,
            subject: `${expiringQuotes.length} quote${expiringQuotes.length > 1 ? 's' : ''} expiring in 2 days`,
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <div style="background: #f97316; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Expiring Quotes</h1>
                  </div>
                  <div style="padding: 32px;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                      <strong>${expiringQuotes.length}</strong> of your quote${expiringQuotes.length > 1 ? 's' : ''} will expire in the next 2 days.
                    </p>

                    <div style="background: #fff7ed; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                      ${expiringQuotes.slice(0, 5).map(q => {
                        const clientName = getClientName(q.qs_quote_requests)
                        const total = q.total_gross || q.total || 0
                        const validDate = q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-US') : ''
                        return `
                          <p style="color: #9a3412; font-size: 14px; margin: 8px 0;">
                            <strong>${clientName}</strong>: ${total.toFixed(2)} (expires ${validDate})
                          </p>
                        `
                      }).join('')}
                    </div>

                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
                      Contact your clients to remind them about the quote before it expires.
                    </p>

                    <a href="${appUrl}/quotes" style="display: block; background: #f97316; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                      View Quotes
                    </a>
                  </div>
                  <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote - Reminder</p>
                    ${emailUnsubscribeFooter(profile.id, appUrl)}
                  </div>
                </div>
              </body>
              </html>
            `,
          })
          results.expiringQuotes += expiringQuotes.length
        } catch {
          results.errors.push(`Failed to send expiring quotes email to ${profile.email}`)
        }
      }
    }

    // Auto-send payment reminders to clients for overdue invoices
    // Only if no reminder sent in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: overdueForClients } = await supabase
      .from('qs_invoices')
      .select('id, invoice_number, client_name, client_email, total_gross, due_date, token, currency, user_id, bank_name, bank_account, bank_routing, reminder_count')
      .eq('status', 'sent')
      .not('client_email', 'is', null)
      .not('due_date', 'is', null)
      .lt('due_date', now.toISOString())
      .or(`reminder_sent_at.is.null,reminder_sent_at.lt.${sevenDaysAgo.toISOString()}`)

    if (overdueForClients && overdueForClients.length > 0) {
      for (const inv of overdueForClients) {
        try {
          // Get contractor profile for this invoice
          const { data: contractorProfile } = await supabase
            .from('profiles')
            .select('full_name, company_name, phone, bank_name, bank_account, bank_routing, country')
            .eq('id', inv.user_id)
            .single()

          const contractorName = escapeHtml(contractorProfile?.company_name || contractorProfile?.full_name || 'Contractor')
          const countryCode = contractorProfile?.country || 'US'
          const countryConfig = COUNTRIES[countryCode] || COUNTRIES.US
          const currencySymbol = getCurrencySymbol(inv.currency || 'USD')

          const dueDate = new Date(inv.due_date)
          const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

          const bankName = inv.bank_name || contractorProfile?.bank_name
          const bankAccount = inv.bank_account || contractorProfile?.bank_account
          const bankRouting = inv.bank_routing || contractorProfile?.bank_routing

          const bankHtml = (bankName || bankAccount || bankRouting) ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; color: #166534; font-size: 13px; font-weight: 700;">Payment Details</p>
              ${bankName ? `<p style="margin: 2px 0; color: #374151; font-size: 13px;">Bank: <strong>${bankName}</strong></p>` : ''}
              ${bankRouting ? `<p style="margin: 2px 0; color: #374151; font-size: 13px;">${countryConfig.bankRoutingLabel}: <strong style="font-family: monospace;">${bankRouting}</strong></p>` : ''}
              ${bankAccount ? `<p style="margin: 2px 0; color: #374151; font-size: 13px;">Account: <strong style="font-family: monospace;">${bankAccount}</strong></p>` : ''}
            </div>
          ` : ''

          await resend.emails.send({
            from: 'BrickQuote <contact@brickquote.app>',
            to: inv.client_email,
            subject: `Payment reminder — ${inv.invoice_number} from ${contractorName}`,
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Payment Reminder</h1>
                  </div>
                  <div style="padding: 32px;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                      Hi <strong>${escapeHtml(inv.client_name || 'there')}</strong>,
                    </p>
                    <p style="color: #6b7280; font-size: 15px; margin: 0 0 20px 0;">
                      This is a friendly reminder that invoice <strong>${inv.invoice_number}</strong> from <strong>${contractorName}</strong> was due on <strong>${formatDate(inv.due_date, countryCode)}</strong> — <strong>${diffDays} day${diffDays > 1 ? 's' : ''} ago</strong>.
                    </p>
                    <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
                      <p style="color: #92400e; font-size: 12px; margin: 0 0 4px 0;">Amount Due</p>
                      <p style="color: #78350f; font-size: 24px; font-weight: 700; margin: 0;">${currencySymbol}${inv.total_gross?.toFixed(2)}</p>
                    </div>
                    ${bankHtml}
                    <div style="text-align: center; margin: 24px 0;">
                      <a href="${appUrl}/invoice/${inv.token}" style="display: inline-block; background: #f97316; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Invoice &amp; Pay</a>
                    </div>
                    ${contractorProfile?.phone ? `<p style="color: #6b7280; font-size: 13px; text-align: center;">Questions? Contact ${contractorName}: <a href="tel:${contractorProfile.phone}" style="color: #3b82f6;">${contractorProfile.phone}</a></p>` : ''}
                  </div>
                  <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote - Payment Reminder</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          })

          // Update reminder tracking
          await supabase
            .from('qs_invoices')
            .update({
              reminder_sent_at: now.toISOString(),
              reminder_count: (inv.reminder_count || 0) + 1,
            })
            .eq('id', inv.id)

          results.clientReminders++
        } catch {
          results.errors.push(`Failed to send client reminder for ${inv.invoice_number}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Cron reminders error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
