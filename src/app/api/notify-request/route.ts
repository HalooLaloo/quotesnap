import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { escapeHtml } from '@/lib/escapeHtml'
import { emailUnsubscribeFooter } from '@/lib/emailFooter'
import { rateLimiter, getClientIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    if (rateLimiter) {
      const ip = getClientIP(request)
      const { success } = await rateLimiter.limit(ip)
      if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    }

    if (!process.env.RESEND_API_KEY) {
      console.log('Resend not configured, skipping notification')
      return NextResponse.json({ success: true, skipped: true })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { contractorId, clientName, description } = await request.json()

    if (!contractorId || !clientName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Check if contractor has email notifications enabled
    const { data: contractorProfile } = await supabase
      .from('profiles')
      .select('id, email, email_notifications')
      .eq('id', contractorId)
      .single()

    if (contractorProfile?.email_notifications === false) {
      return NextResponse.json({ success: true, skipped: true, reason: 'unsubscribed' })
    }

    // Get contractor email
    let contractorEmail: string | undefined = contractorProfile?.email

    // If not in profiles, try auth.admin
    if (!contractorEmail) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(contractorId)
        contractorEmail = userData?.user?.email
      } catch {
        // Fallback to qs_profiles table
        const { data: profile } = await supabase
          .from('qs_profiles')
          .select('email')
          .eq('id', contractorId)
          .single()
        contractorEmail = profile?.email
      }
    }

    if (!contractorEmail) {
      console.log('Contractor email not found, skipping notification')
      return NextResponse.json({ success: true, skipped: true })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brickquote.app'

    // Shorten description to first 200 characters
    const shortDescription = description
      ? description.substring(0, 200) + (description.length > 200 ? '...' : '')
      : 'No description provided'

    // Send email
    const { error: sendError } = await resend.emails.send({
      from: 'BrickQuote <contact@brickquote.app>',
      to: contractorEmail,
      subject: `New quote request from ${clientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: #3b82f6; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Quote Request!</h1>
            </div>
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                You have received a new quote request from <strong>${escapeHtml(clientName)}</strong>.
              </p>

              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Preview:</p>
                <p style="color: #374151; font-size: 14px; margin: 0; white-space: pre-wrap;">${escapeHtml(shortDescription)}</p>
              </div>

              <a href="https://brickquote.app/requests" style="display: block; background: #ea580c; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                View Request
              </a>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote</p>
              ${emailUnsubscribeFooter(contractorId, appUrl)}
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (sendError) {
      console.error('Failed to send notification email:', sendError)
      // Don't return error - notification is not critical
      return NextResponse.json({ success: true, emailSent: false })
    }

    return NextResponse.json({ success: true, emailSent: true })
  } catch (error) {
    console.error('Notify request API error:', error)
    // Don't return error - notification is not critical
    return NextResponse.json({ success: true, error: 'Notification failed' })
  }
}
