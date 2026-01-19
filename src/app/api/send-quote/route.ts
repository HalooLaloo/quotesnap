import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { QuoteItem } from '@/lib/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { quoteId } = await request.json()

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Pobierz wycenę z danymi klienta
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

    // Pobierz dane wykonawcy
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, phone')
      .eq('id', user?.id)
      .single()

    const contractorName = profile?.company_name || profile?.full_name || 'Wykonawca'
    const items = (quote.items || []) as QuoteItem[]

    // Generuj HTML emaila
    const emailHtml = generateQuoteEmailHtml({
      clientName: quote.qs_quote_requests?.client_name || 'Kliencie',
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
      notes: quote.notes,
    })

    // Wyślij email
    const { error: sendError } = await resend.emails.send({
      from: 'QuoteSnap <onboarding@resend.dev>', // Zmień na swoją domenę po weryfikacji
      to: clientEmail,
      subject: `Wycena od ${contractorName}`,
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
  notes?: string
}

function generateQuoteEmailHtml(data: QuoteEmailData): string {
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
        ${item.unit_price.toFixed(2)} PLN
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
        ${item.total.toFixed(2)} PLN
      </td>
    </tr>
  `).join('')

  const discountHtml = data.discountPercent > 0 ? `
    <tr>
      <td colspan="3" style="padding: 8px 12px; text-align: right;">Rabat (${data.discountPercent}%):</td>
      <td style="padding: 8px 12px; text-align: right; color: #dc2626;">-${(data.subtotal * data.discountPercent / 100).toFixed(2)} PLN</td>
    </tr>
  ` : ''

  const vatHtml = data.vatPercent > 0 ? `
    <tr>
      <td colspan="3" style="padding: 8px 12px; text-align: right;">Netto:</td>
      <td style="padding: 8px 12px; text-align: right;">${data.totalNet.toFixed(2)} PLN</td>
    </tr>
    <tr>
      <td colspan="3" style="padding: 8px 12px; text-align: right;">VAT (${data.vatPercent}%):</td>
      <td style="padding: 8px 12px; text-align: right;">+${(data.totalNet * data.vatPercent / 100).toFixed(2)} PLN</td>
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
      <h1 style="color: white; margin: 0; font-size: 28px;">Wycena</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">od ${data.contractorName}</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        Cześć <strong>${data.clientName}</strong>,
      </p>
      <p style="color: #6b7280; font-size: 15px; margin: 0 0 32px 0;">
        Dziękuję za zainteresowanie. Poniżej znajdziesz szczegółową wycenę prac:
      </p>

      <!-- Items table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Usługa</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Ilość</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Cena</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Razem</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px 12px; text-align: right;">Suma częściowa:</td>
            <td style="padding: 8px 12px; text-align: right;">${data.subtotal.toFixed(2)} PLN</td>
          </tr>
          ${discountHtml}
          ${vatHtml}
          <tr style="background: #f0fdf4;">
            <td colspan="3" style="padding: 16px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #166534;">${data.vatPercent > 0 ? 'BRUTTO' : 'DO ZAPŁATY'}:</td>
            <td style="padding: 16px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #166534;">${data.total.toFixed(2)} PLN</td>
          </tr>
        </tfoot>
      </table>

      ${data.notes ? `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Uwagi:</strong><br>
            ${data.notes}
          </p>
        </div>
      ` : ''}

      ${data.availableFrom ? `
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
          Możliwy termin rozpoczęcia prac: <strong>${new Date(data.availableFrom).toLocaleDateString('pl-PL')}</strong>
        </p>
      ` : ''}

      ${data.validUntil ? `
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
          Wycena ważna do: <strong>${new Date(data.validUntil).toLocaleDateString('pl-PL')}</strong>
        </p>
      ` : ''}

      <!-- Info o cenie orientacyjnej -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #1e40af; font-size: 13px;">
          <strong>Informacja:</strong> Powyższa wycena ma charakter orientacyjny i została przygotowana na podstawie przekazanego opisu.
          Ostateczna cena może nieznacznie różnić się po osobistej wizji i dokładnej ocenie zakresu prac na miejscu.
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <p style="color: #374151; margin: 0 0 16px 0;">Masz pytania? Skontaktuj się:</p>
        ${data.contractorPhone ? `
          <a href="tel:${data.contractorPhone}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Zadzwoń: ${data.contractorPhone}
          </a>
        ` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 13px; margin: 0;">
        Wycena wygenerowana przez QuoteSnap
      </p>
    </div>
  </div>
</body>
</html>
  `
}
