import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { COUNTRIES } from '@/lib/countries'
import { escapeHtml } from '@/lib/escapeHtml'

import { emailLayout } from '@/lib/emailTemplate'
import { sendPushNotification } from '@/lib/pushNotification'
import { rateLimiter, getClientIP } from '@/lib/ratelimit'

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

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

    // Check if required env vars are configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing required environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role (for public access)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const resend = new Resend(process.env.RESEND_API_KEY)

    const body = await request.json()
    const { token, action } = body

    if (!token || !action || !/^[a-f0-9]{32}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Find quote by token
    const { data: quote, error: quoteError } = await supabase
      .from('qs_quotes')
      .select(`
        *,
        qs_quote_requests (
          client_name,
          client_email,
          description
        )
      `)
      .eq('token', token)
      .single()

    if (quoteError || !quote) {
      console.error('Quote not found:', quoteError)
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    if (quote.status !== 'sent') {
      return NextResponse.json(
        { error: 'Quote cannot be modified' },
        { status: 400 }
      )
    }

    // Update quote status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected'
    const { error: updateError } = await supabase
      .from('qs_quotes')
      .update({
        status: newStatus,
        accepted_at: action === 'accept' ? new Date().toISOString() : null,
      })
      .eq('id', quote.id)

    if (updateError) {
      console.error('Update quote error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update quote' },
        { status: 500 }
      )
    }

    // Update request status
    await supabase
      .from('qs_quote_requests')
      .update({ status: newStatus })
      .eq('id', quote.request_id)

    const { data: contractorProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', quote.user_id)
      .single()

    let contractorEmail: string | undefined = contractorProfile?.email

    if (!contractorEmail) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(quote.user_id)
        contractorEmail = userData?.user?.email
      } catch {
        // no email found
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brickquote.app'

    // Send notification email to contractor
    if (process.env.RESEND_API_KEY && contractorEmail) {
      const clientName = escapeHtml(quote.qs_quote_requests?.client_name || 'Client')
      const statusText = action === 'accept' ? 'accepted' : 'rejected'
      const statusColor = action === 'accept' ? '#22c55e' : '#ef4444'
      const currencySymbol = getCurrencySymbol(quote.currency || 'USD')

      await resend.emails.send({
        from: 'BrickQuote <contact@brickquote.app>',
        to: contractorEmail,
        subject: `Quote ${statusText} by ${clientName}`,
        html: emailLayout({
          accentColor: statusColor,
          title: `Quote ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}!`,
          content: `
                <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                  <strong>${clientName}</strong> has ${statusText} your quote.
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
                  Quote total: <strong>${currencySymbol}${quote.total.toFixed(2)}</strong>
                </p>
                ${action === 'accept' ? `
                  <p style="color: #166534; font-size: 14px; margin: 0; background: #f0fdf4; padding: 16px; border-radius: 8px;">
                    Great news! You can now proceed with the project. Contact your client to discuss next steps.
                  </p>
                ` : `
                  <p style="color: #991b1b; font-size: 14px; margin: 0; background: #fef2f2; padding: 16px; border-radius: 8px;">
                    The client has declined this quote. Consider reaching out to discuss their concerns.
                  </p>
                `}`,
        }),
      })
    }

    // Send push notification to contractor
    await sendPushNotification({
      userId: quote.user_id,
      title: `Quote ${action === 'accept' ? 'accepted' : 'rejected'}!`,
      body: `${quote.qs_quote_requests?.client_name || 'Client'} has ${action === 'accept' ? 'accepted' : 'rejected'} your quote`,
      data: { url: '/quotes' },
    })

    return NextResponse.json({
      success: true,
      status: newStatus,
    })
  } catch (error) {
    console.error('Accept quote API error:', error)
    // Return more details in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
