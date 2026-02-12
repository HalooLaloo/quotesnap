import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { InvoiceItem } from '@/lib/types'
import { COUNTRIES, formatDate } from '@/lib/countries'

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

// Force Node.js runtime for PDF generation
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Transliterate Polish and other special characters to ASCII
function toAscii(text: string | null | undefined): string {
  if (!text) return ''
  const map: Record<string, string> = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
    'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
    'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z',
    // German
    'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
    'Ä': 'A', 'Ö': 'O', 'Ü': 'U',
    // French
    'à': 'a', 'â': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'î': 'i', 'ï': 'i', 'ô': 'o', 'ù': 'u', 'û': 'u', 'ç': 'c',
    'À': 'A', 'Â': 'A', 'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'Î': 'I', 'Ï': 'I', 'Ô': 'O', 'Ù': 'U', 'Û': 'U', 'Ç': 'C',
  }
  return text.split('').map(char => map[char] || char).join('')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch invoice data
    const { data: invoice, error } = await supabase
      .from('qs_invoices')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Get contractor info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, phone, email, bank_name, bank_account, bank_routing, tax_id, business_address, country, company_reg_number')
      .eq('id', invoice.user_id)
      .single()

    const contractorName = toAscii(profile?.company_name || profile?.full_name || 'Contractor')
    const clientName = toAscii(invoice.client_name || 'Client')
    const items = (invoice.items || []) as InvoiceItem[]
    const currencySymbol = getCurrencySymbol(invoice.currency || 'USD')
    const countryCode = profile?.country || 'US'
    const countryConfig = COUNTRIES[countryCode] || COUNTRIES.US

    // Determine invoice title - AU/NZ require "Tax Invoice" when tax is charged
    const invoiceTitle = countryConfig.taxInvoiceTitle && invoice.vat_percent > 0
      ? 'TAX INVOICE'
      : 'INVOICE'

    // Create PDF
    const doc = new jsPDF()

    // Header - App background color
    doc.setFillColor(30, 58, 95) // #1e3a5f - slate blue
    doc.rect(0, 0, 210, 30, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(invoiceTitle, 20, 20)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.invoice_number, 190, 20, { align: 'right' })

    // Contractor info (left)
    let y = 45
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)

    doc.setFont('helvetica', 'bold')
    doc.text('From:', 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(contractorName, 20, y + 6)
    if (profile?.business_address) {
      doc.text(toAscii(profile.business_address), 20, y + 12)
    }
    if (profile?.phone) {
      doc.text(`Tel: ${profile.phone}`, 20, y + 18)
    }
    if (profile?.email) {
      doc.text(`Email: ${profile.email}`, 20, y + 24)
    }
    if (profile?.tax_id) {
      doc.text(`${countryConfig.taxIdLabel}: ${profile.tax_id}`, 20, y + 30)
    }
    if (countryConfig.showCompanyRegNumber && profile?.company_reg_number) {
      const regY = profile?.tax_id ? y + 36 : y + 30
      doc.text(`${countryConfig.companyRegLabel}: ${profile.company_reg_number}`, 20, regY)
    }

    // Client info (right)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To:', 120, y)
    doc.setFont('helvetica', 'normal')
    doc.text(clientName, 120, y + 6)
    if (invoice.client_address) {
      doc.text(toAscii(invoice.client_address), 120, y + 12)
    }
    if (invoice.client_phone) {
      doc.text(`Tel: ${invoice.client_phone}`, 120, y + 18)
    }
    if (invoice.client_email) {
      doc.text(`Email: ${invoice.client_email}`, 120, y + 24)
    }

    // Date info
    y = 100
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const createdDate = formatDate(invoice.created_at, countryCode)
    doc.text(`Invoice Date: ${createdDate}`, 20, y)

    if (invoice.due_date) {
      const dueDate = formatDate(invoice.due_date, countryCode)
      doc.text(`Due Date: ${dueDate}`, 100, y)
    }

    // Items table
    y = 115
    const tableData = items.map(item => [
      toAscii(item.description),
      `${item.quantity} ${toAscii(item.unit)}`,
      `${currencySymbol}${item.unit_price.toFixed(2)}`,
      `${currencySymbol}${item.total.toFixed(2)}`
    ])

    autoTable(doc, {
      startY: y,
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 95], // #1e3a5f - slate blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
    })

    // Summary section
    // @ts-expect-error - autoTable adds lastAutoTable property
    y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY + 15 || y + 60

    const summaryX = 120
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)

    // Subtotal
    doc.text('Subtotal:', summaryX, y)
    doc.text(`${currencySymbol}${invoice.subtotal?.toFixed(2)}`, 190, y, { align: 'right' })

    // Discount
    if (invoice.discount_percent > 0) {
      y += 7
      doc.text(`Discount (${invoice.discount_percent}%):`, summaryX, y)
      doc.setTextColor(220, 38, 38)
      doc.text(`-${currencySymbol}${(invoice.subtotal * invoice.discount_percent / 100).toFixed(2)}`, 190, y, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }

    // Net
    y += 7
    doc.text('Net:', summaryX, y)
    doc.text(`${currencySymbol}${invoice.total_net?.toFixed(2)}`, 190, y, { align: 'right' })

    // Tax (VAT/GST/Sales Tax per country)
    if (invoice.vat_percent > 0) {
      y += 7
      doc.text(`${countryConfig.taxLabel} (${invoice.vat_percent}%):`, summaryX, y)
      doc.text(`${currencySymbol}${(invoice.total_net * invoice.vat_percent / 100).toFixed(2)}`, 190, y, { align: 'right' })
    }

    // Total
    y += 10
    doc.setDrawColor(30, 58, 95) // #1e3a5f
    doc.setLineWidth(0.5)
    doc.line(120, y - 3, 190, y - 3)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 58, 95)
    doc.text('AMOUNT DUE:', 120, y + 2)
    doc.text(`${currencySymbol}${invoice.total_gross?.toFixed(2)}`, 190, y + 2, { align: 'right' })
    doc.setTextColor(0, 0, 0)

    // Payment Details — styled box
    if (profile?.bank_name || profile?.bank_account || profile?.bank_routing || invoice.payment_terms) {
      if (y > 220) {
        doc.addPage()
        y = 20
      } else {
        y += 20
      }

      // Light gray background box
      const boxStartY = y - 4
      let boxContentHeight = 12 // header + padding
      if (profile?.bank_name) boxContentHeight += 7
      if (profile?.bank_routing) boxContentHeight += 7
      if (profile?.bank_account) boxContentHeight += 7
      if (invoice.payment_terms) boxContentHeight += 7
      if (invoice.due_date) boxContentHeight += 7

      doc.setFillColor(245, 247, 250) // light gray
      doc.setDrawColor(200, 210, 220)
      doc.roundedRect(20, boxStartY, 170, boxContentHeight, 2, 2, 'FD')

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 58, 95)
      doc.text('Payment Details', 28, y + 2)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)

      if (profile?.bank_name) {
        y += 8
        doc.setFont('helvetica', 'bold')
        doc.text('Bank:', 28, y)
        doc.setFont('helvetica', 'normal')
        doc.text(toAscii(profile.bank_name), 55, y)
      }
      if (profile?.bank_routing) {
        y += 7
        doc.setFont('helvetica', 'bold')
        doc.text(`${countryConfig.bankRoutingLabel}:`, 28, y)
        doc.setFont('helvetica', 'normal')
        doc.setFont('courier', 'normal')
        doc.text(profile.bank_routing, 75, y)
        doc.setFont('helvetica', 'normal')
      }
      if (profile?.bank_account) {
        y += 7
        doc.setFont('helvetica', 'bold')
        doc.text('Account:', 28, y)
        doc.setFont('helvetica', 'normal')
        doc.setFont('courier', 'normal')
        doc.text(profile.bank_account, 55, y)
        doc.setFont('helvetica', 'normal')
      }
      if (invoice.payment_terms) {
        y += 7
        doc.setFont('helvetica', 'bold')
        doc.text('Terms:', 28, y)
        doc.setFont('helvetica', 'normal')
        doc.text(toAscii(invoice.payment_terms), 55, y)
      }
      if (invoice.due_date) {
        y += 7
        doc.setFont('helvetica', 'bold')
        doc.text('Due Date:', 28, y)
        doc.setFont('helvetica', 'normal')
        const dueStr = formatDate(invoice.due_date, countryCode)
        doc.text(dueStr, 55, y)
      }
    }

    // Notes
    if (invoice.notes) {
      // Check if we need a new page
      if (y > 240) {
        doc.addPage()
        y = 20
      } else {
        y += 15
      }

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Notes:', 20, y)
      doc.setFont('helvetica', 'normal')

      const splitNotes = doc.splitTextToSize(toAscii(invoice.notes), 170)
      doc.text(splitNotes, 20, y + 6)
    }

    // Thank you message
    const pageCount = doc.getNumberOfPages()
    doc.setPage(pageCount)

    doc.setFontSize(10)
    doc.setTextColor(30, 58, 95)
    doc.setFont('helvetica', 'bold')
    doc.text('Thank you for your business!', 105, 270, { align: 'center' })

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('Invoice generated by BrickQuote', 105, 285, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}-${clientName.replace(/\s+/g, '-')}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to generate PDF: ${errorMessage}` }, { status: 500 })
  }
}
