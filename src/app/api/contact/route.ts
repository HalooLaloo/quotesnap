import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimiter, getClientIP } from '@/lib/ratelimit'
import { escapeHtml } from '@/lib/escapeHtml'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    // Rate limit: 5 requests per hour per IP
    if (rateLimiter) {
      const ip = getClientIP(request)
      const { success } = await rateLimiter.limit(`contact:${ip}`)
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      }
    }

    const { name, email, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      )
    }

    if (typeof name !== 'string' || name.length > 200) {
      return NextResponse.json({ error: 'Invalid name.' }, { status: 400 })
    }
    if (typeof email !== 'string' || email.length > 200 || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email.' }, { status: 400 })
    }
    if (typeof message !== 'string' || message.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters).' }, { status: 400 })
    }

    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeMessage = escapeHtml(message)

    await resend.emails.send({
      from: 'BrickQuote Contact <contact@brickquote.app>',
      to: 'pawellewandowsky@gmail.com',
      replyTo: email,
      subject: `Contact form: ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #1e3a5f;">New Contact Form Message</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b; width: 80px;">Name</td>
              <td style="padding: 8px 12px;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">Email</td>
              <td style="padding: 8px 12px;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
            </tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f1f5f9; border-radius: 8px;">
            <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          <p style="margin-top: 16px; color: #94a3b8; font-size: 12px;">
            Sent from BrickQuote contact form. Reply directly to respond to ${safeName}.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}
