import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { InvoiceItem } from '@/lib/types'
import { COUNTRIES, formatDate } from '@/lib/countries'

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()
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

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('qs_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user?.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const clientEmail = invoice.client_email
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client email not found' },
        { status: 400 }
      )
    }

    // Get contractor profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, phone, bank_name, bank_account, tax_id, business_address, country')
      .eq('id', user?.id)
      .single()

    const contractorName = profile?.company_name || profile?.full_name || 'Contractor'
    const items = (invoice.items || []) as InvoiceItem[]

    // Generate invoice view URL
    const invoiceUrl = `${protocol}://${host}/invoice/${invoice.token}`

    // Generate email HTML
    const currencySymbol = getCurrencySymbol(invoice.currency || 'USD')
    const countryCode = profile?.country || 'US'
    const countryConfig = COUNTRIES[countryCode] || COUNTRIES.US
    const emailHtml = generateInvoiceEmailHtml({
      clientName: invoice.client_name || 'Client',
      contractorName,
      contractorPhone: profile?.phone,
      invoiceNumber: invoice.invoice_number,
      items,
      subtotal: invoice.subtotal,
      discountPercent: invoice.discount_percent,
      vatPercent: invoice.vat_percent || 0,
      totalNet: invoice.total_net || invoice.subtotal,
      totalGross: invoice.total_gross || invoice.subtotal,
      dueDate: invoice.due_date,
      notes: invoice.notes,
      invoiceUrl,
      bankName: profile?.bank_name,
      bankAccount: profile?.bank_account,
      paymentTerms: invoice.payment_terms,
      currencySymbol,
      countryCode,
      taxLabel: countryConfig.taxLabel,
      taxInvoiceTitle: countryConfig.taxInvoiceTitle,
    })

    // Send email
    const { error: sendError } = await resend.emails.send({
      from: 'BrickQuote <contact@brickquote.app>',
      to: clientEmail,
      subject: `Invoice ${invoice.invoice_number} from ${contractorName}`,
      html: emailHtml,
    })

    if (sendError) {
      console.error('Resend error:', sendError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Update invoice status to sent
    const { error: updateError } = await supabase
      .from('qs_invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice status:', updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send invoice API error:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}

interface InvoiceEmailData {
  clientName: string
  contractorName: string
  contractorPhone?: string
  invoiceNumber: string
  items: InvoiceItem[]
  subtotal: number
  discountPercent: number
  vatPercent: number
  totalNet: number
  totalGross: number
  dueDate?: string
  notes?: string
  invoiceUrl?: string
  bankName?: string
  bankAccount?: string
  paymentTerms?: string
  currencySymbol: string
  countryCode: string
  taxLabel: string
  taxInvoiceTitle: boolean
}

function generateInvoiceEmailHtml(data: InvoiceEmailData): string {
  const cs = data.currencySymbol
  const invoiceTitle = data.taxInvoiceTitle && data.vatPercent > 0 ? 'Tax Invoice' : 'Invoice'
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.description}</strong>
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

  const bankInfoHtml = (data.bankName || data.bankAccount) ? `
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 14px 0; color: #166534; font-size: 15px; font-weight: 700;">Payment Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.bankName ? `<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 80px;">Bank</td><td style="padding: 4px 0; color: #374151; font-size: 14px; font-weight: 600;">${data.bankName}</td></tr>` : ''}
        ${data.bankAccount ? `<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Account</td><td style="padding: 4px 0; color: #374151; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace; letter-spacing: 0.5px;">${data.bankAccount}</td></tr>` : ''}
        ${data.paymentTerms ? `<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Terms</td><td style="padding: 4px 0; color: #374151; font-size: 14px;">${data.paymentTerms}</td></tr>` : ''}
      </table>
    </div>
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
    <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">${invoiceTitle}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${data.invoiceNumber}</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        Hi <strong>${data.clientName}</strong>,
      </p>
      <p style="color: #6b7280; font-size: 15px; margin: 0 0 32px 0;">
        Please find below the invoice for services provided:
      </p>

      <!-- Items table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Description</th>
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
            <td colspan="3" style="padding: 16px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #166534;">AMOUNT DUE:</td>
            <td style="padding: 16px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #166534;">${cs}${data.totalGross.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${bankInfoHtml}

      ${data.dueDate ? `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Due date:</strong> ${formatDate(data.dueDate, data.countryCode)}
          </p>
        </div>
      ` : ''}

      ${data.notes ? `
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>Notes:</strong><br>
            ${data.notes}
          </p>
        </div>
      ` : ''}

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        ${data.invoiceUrl ? `
          <a href="${data.invoiceUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-bottom: 16px;">
            View Invoice Online
          </a>
          <p style="color: #6b7280; font-size: 13px; margin: 16px 0;">Or copy link: ${data.invoiceUrl}</p>
        ` : ''}
        <p style="color: #374151; margin: 16px 0 16px 0;">Questions? Contact us:</p>
        ${data.contractorPhone ? `
          <a href="tel:${data.contractorPhone}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Call: ${data.contractorPhone}
          </a>
        ` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 13px; margin: 0;">
        Invoice generated by BrickQuote
      </p>
    </div>
  </div>
</body>
</html>
  `
}
