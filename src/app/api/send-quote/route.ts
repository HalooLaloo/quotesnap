import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { QuoteItem } from '@/lib/types'
import { COUNTRIES } from '@/lib/countries'
import { escapeHtml } from '@/lib/escapeHtml'

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { quoteId } = await request.json()
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch quote with client data
    const { data: quote, error: quoteError } = await supabase
      .from('qs_quotes')
      .select(`
        *,
        qs_quote_requests (
          client_name,
          client_email,
          client_phone,
          description
        )
      `)
      .eq('id', quoteId)
      .eq('user_id', user?.id)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    const clientEmail = quote.qs_quote_requests?.client_email
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client email not found' },
        { status: 400 }
      )
    }

    // Fetch contractor data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, company_name, phone, country')
      .eq('id', user?.id)
      .single()

    const contractorName = profile?.company_name || profile?.full_name || 'Contractor'
    const items = (quote.items || []) as QuoteItem[]

    // Generate quote view URL
    const quoteUrl = `${protocol}://${host}/quote/${quote.token}`

    // Generate email HTML
    const currencySymbol = getCurrencySymbol(quote.currency || 'USD')
    const countryCode = profile?.country || 'US'
    const countryConfig = COUNTRIES[countryCode] || COUNTRIES.US
    // Parse notes: separate general notes from client answer
    const rawNotes = quote.notes || ''
    const [generalNotes, clientAnswer] = rawNotes.split('---CLIENT_ANSWER---').map((s: string) => s.trim())

    // Extract client question from request description
    const questionMatch = quote.qs_quote_requests?.description?.match(/QUESTION FOR CONTRACTOR:\s*([\s\S]+?)(?=\n\n|---CONVERSATION---|$)/)
    const clientQuestion = questionMatch?.[1]?.trim()

    const emailHtml = generateQuoteEmailHtml({
      clientName: escapeHtml(quote.qs_quote_requests?.client_name || 'Client'),
      contractorName,
      contractorPhone: profile?.phone,
      items,
      subtotal: quote.subtotal,
      discountPercent: quote.discount_percent,
      vatPercent: quote.vat_percent || 0,
      totalNet: quote.total_net || quote.total,
      totalGross: quote.total_gross || quote.total,
      total: quote.total,
      validUntil: quote.valid_until,
      availableFrom: quote.available_from,
      notes: generalNotes || null,
      clientQuestion: clientQuestion || null,
      clientAnswer: clientAnswer || null,
      quoteUrl,
      currencySymbol,
      taxLabel: countryConfig.taxLabel,
    })

    // Send email
    const { error: sendError } = await resend.emails.send({
      from: 'BrickQuote <contact@brickquote.app>',
      to: clientEmail,
      subject: `Quote from ${contractorName}`,
      html: emailHtml,
    })

    if (sendError) {
      console.error('Resend error:', sendError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send quote API error:', error)
    return NextResponse.json(
      { error: 'Failed to send quote' },
      { status: 500 }
    )
  }
}

interface QuoteEmailData {
  clientName: string
  contractorName: string
  contractorPhone?: string
  items: QuoteItem[]
  subtotal: number
  discountPercent: number
  vatPercent: number
  totalNet: number
  totalGross: number
  total: number
  validUntil?: string
  availableFrom?: string
  notes?: string | null
  clientQuestion?: string | null
  clientAnswer?: string | null
  quoteUrl?: string
  currencySymbol: string
  taxLabel: string
}

function generateQuoteEmailHtml(data: QuoteEmailData): string {
  const cs = data.currencySymbol
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.service_name}</strong>
        ${item.reason ? `<br><span style="color: #6b7280; font-size: 13px;">${item.reason}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${item.quantity} ${item.unit}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${cs}${item.unit_price.toFixed(2)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
        ${cs}${item.total.toFixed(2)}
      </td>
    </tr>
  `).join('')

  const discountHtml = data.discountPercent > 0 ? `
    <tr>
      <td colspan="3" style="padding: 8px 12px; text-align: right;">Discount (${data.discountPercent}%):</td>
      <td style="padding: 8px 12px; text-align: right; color: #dc2626;">-${cs}${(data.subtotal * data.discountPercent / 100).toFixed(2)}</td>
    </tr>
  ` : ''

  const vatHtml = data.vatPercent > 0 ? `
    <tr>
      <td colspan="3" style="padding: 8px 12px; text-align: right;">Net:</td>
      <td style="padding: 8px 12px; text-align: right;">${cs}${data.totalNet.toFixed(2)}</td>
    </tr>
    <tr>
      <td colspan="3" style="padding: 8px 12px; text-align: right;">${data.taxLabel} (${data.vatPercent}%):</td>
      <td style="padding: 8px 12px; text-align: right;">+${cs}${(data.totalNet * data.vatPercent / 100).toFixed(2)}</td>
    </tr>
  ` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Quote</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">from ${data.contractorName}</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        Hi <strong>${data.clientName}</strong>,
      </p>
      <p style="color: #6b7280; font-size: 15px; margin: 0 0 32px 0;">
        Thank you for your interest. Below you will find a detailed quote for the work:
      </p>

      <!-- Items table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Service</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Price</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px 12px; text-align: right;">Subtotal:</td>
            <td style="padding: 8px 12px; text-align: right;">${cs}${data.subtotal.toFixed(2)}</td>
          </tr>
          ${discountHtml}
          ${vatHtml}
          <tr style="background: #f0fdf4;">
            <td colspan="3" style="padding: 16px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #166534;">ESTIMATE:</td>
            <td style="padding: 16px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #166534;">${cs}${data.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${data.notes ? `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Notes:</strong><br>
            ${data.notes}
          </p>
        </div>
      ` : ''}

      ${data.clientQuestion && data.clientAnswer ? `
        <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 8px 0; color: #6d28d9; font-size: 13px; font-weight: 600;">Your question:</p>
          <p style="margin: 0 0 12px 0; color: #4c1d95; font-size: 14px;">${data.clientQuestion}</p>
          <p style="margin: 0 0 8px 0; color: #6d28d9; font-size: 13px; font-weight: 600;">Answer from ${data.contractorName}:</p>
          <p style="margin: 0; color: #4c1d95; font-size: 14px;">${data.clientAnswer}</p>
        </div>
      ` : ''}

      ${data.availableFrom ? `
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
          Available start date: <strong>${new Date(data.availableFrom).toLocaleDateString('en-US')}</strong>
        </p>
      ` : ''}

      ${data.validUntil ? `
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
          Quote valid until: <strong>${new Date(data.validUntil).toLocaleDateString('en-US')}</strong>
        </p>
      ` : ''}

      <!-- Estimate info -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #1e40af; font-size: 13px;">
          <strong>Note:</strong> This quote is an estimate based on the information provided.
          The final price may vary slightly after an on-site inspection and detailed assessment of the work scope.
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        ${data.quoteUrl ? `
          <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #1e40af; font-size: 15px; margin: 0 0 4px 0; font-weight: 600;">
              Ready to review?
            </p>
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px 0;">
              View the full quote online, download a PDF, and let us know if you'd like to proceed.
            </p>
            <a href="${data.quoteUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
              View Quote
            </a>
            <p style="color: #9ca3af; font-size: 11px; margin: 16px 0 0 0;">
              ${data.validUntil ? `This quote expires on ${new Date(data.validUntil).toLocaleDateString('en-US')}. Please respond before then.` : 'Please respond at your earliest convenience.'}
            </p>
          </div>
        ` : ''}
        ${data.contractorPhone ? `
          <p style="color: #374151; margin: 16px 0 8px 0;">Have questions? Reach out directly:</p>
          <a href="tel:${data.contractorPhone}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Call: ${data.contractorPhone}
          </a>
        ` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 13px; margin: 0;">
        Quote generated by BrickQuote
      </p>
    </div>
  </div>
</body>
</html>
  `
}
