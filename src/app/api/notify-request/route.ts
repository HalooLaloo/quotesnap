import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
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

    // Pobierz email wykonawcy
    let contractorEmail: string | undefined

    // Najpierw spróbuj z auth.admin
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(contractorId)
      contractorEmail = userData?.user?.email
    } catch {
      // Fallback do tabeli profiles
      const { data: profile } = await supabase
        .from('qs_profiles')
        .select('email')
        .eq('id', contractorId)
        .single()
      contractorEmail = profile?.email
    }

    // Jeśli nie znaleziono w qs_profiles, spróbuj profiles
    if (!contractorEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', contractorId)
        .single()
      contractorEmail = profile?.email
    }

    if (!contractorEmail) {
      console.log('Contractor email not found, skipping notification')
      return NextResponse.json({ success: true, skipped: true })
    }

    // Skróć opis do pierwszych 200 znaków
    const shortDescription = description
      ? description.substring(0, 200) + (description.length > 200 ? '...' : '')
      : 'No description provided'

    // Wyślij email
    const { error: sendError } = await resend.emails.send({
      from: 'BrickQuote <onboarding@resend.dev>',
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
                You have received a new quote request from <strong>${clientName}</strong>.
              </p>

              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Preview:</p>
                <p style="color: #374151; font-size: 14px; margin: 0; white-space: pre-wrap;">${shortDescription}</p>
              </div>

              <a href="https://brickquote.app/requests" style="display: block; background: #ea580c; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                Zobacz zapytanie
              </a>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">BrickQuote</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (sendError) {
      console.error('Failed to send notification email:', sendError)
      // Nie zwracamy błędu - notyfikacja nie jest krytyczna
      return NextResponse.json({ success: true, emailSent: false })
    }

    return NextResponse.json({ success: true, emailSent: true })
  } catch (error) {
    console.error('Notify request API error:', error)
    // Nie zwracamy błędu - notyfikacja nie jest krytyczna
    return NextResponse.json({ success: true, error: 'Notification failed' })
  }
}
