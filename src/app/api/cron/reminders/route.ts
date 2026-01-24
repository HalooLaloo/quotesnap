import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

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
      console.log('Missing env vars, skipping reminders')
      return NextResponse.json({ success: true, skipped: true })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const resend = new Resend(process.env.RESEND_API_KEY)

    const results = {
      overdueInvoices: 0,
      expiringQuotes: 0,
      errors: [] as string[],
    }

    // Get all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, message: 'No users found' })
    }

    const now = new Date()
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

    for (const profile of profiles) {
      if (!profile.email) continue

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
            from: 'BrickQuote <onboarding@resend.dev>',
            to: profile.email,
            subject: `Masz ${overdueInvoices.length} przeterminowanych faktur`,
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <div style="background: #ef4444; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Przeterminowane faktury</h1>
                  </div>
                  <div style="padding: 32px;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                      Masz <strong>${overdueInvoices.length}</strong> przeterminowanych faktur na łączną kwotę <strong>${totalOverdue.toFixed(2)} PLN</strong>.
                    </p>

                    <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                      ${overdueInvoices.slice(0, 5).map(inv => `
                        <p style="color: #991b1b; font-size: 14px; margin: 8px 0;">
                          <strong>${inv.invoice_number}</strong> - ${inv.client_name}: ${inv.total_gross?.toFixed(2)} PLN
                        </p>
                      `).join('')}
                      ${overdueInvoices.length > 5 ? `<p style="color: #6b7280; font-size: 12px; margin: 8px 0;">...i ${overdueInvoices.length - 5} więcej</p>` : ''}
                    </div>

                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://brickquote.app'}/invoices" style="display: block; background: #ef4444; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                      Zobacz faktury
                    </a>
                  </div>
                  <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote - Przypomnienie</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          })
          results.overdueInvoices += overdueInvoices.length
        } catch (err) {
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
            from: 'BrickQuote <onboarding@resend.dev>',
            to: profile.email,
            subject: `${expiringQuotes.length} wycen wygasa w ciągu 2 dni`,
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <div style="background: #f97316; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Wygasające wyceny</h1>
                  </div>
                  <div style="padding: 32px;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                      <strong>${expiringQuotes.length}</strong> Twoich wycen wygasa w ciągu najbliższych 2 dni.
                    </p>

                    <div style="background: #fff7ed; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                      ${expiringQuotes.slice(0, 5).map(q => {
                        const clientName = getClientName(q.qs_quote_requests)
                        const total = q.total_gross || q.total || 0
                        const validDate = q.valid_until ? new Date(q.valid_until).toLocaleDateString('pl-PL') : ''
                        return `
                          <p style="color: #9a3412; font-size: 14px; margin: 8px 0;">
                            <strong>${clientName}</strong>: ${total.toFixed(2)} PLN (do ${validDate})
                          </p>
                        `
                      }).join('')}
                    </div>

                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
                      Skontaktuj się z klientami, aby przypomnieć im o wycenie przed jej wygaśnięciem.
                    </p>

                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://brickquote.app'}/quotes" style="display: block; background: #f97316; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                      Zobacz wyceny
                    </a>
                  </div>
                  <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote - Przypomnienie</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          })
          results.expiringQuotes += expiringQuotes.length
        } catch (err) {
          results.errors.push(`Failed to send expiring quotes email to ${profile.email}`)
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
