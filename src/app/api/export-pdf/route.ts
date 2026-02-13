import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { createClient } from '@/lib/supabase/server'
import { QuoteItem } from '@/lib/types'
import { COUNTRIES } from '@/lib/countries'

function toAscii(text: string | null | undefined): string {
  if (!text) return ''
  const map: Record<string, string> = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
    'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
    'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z',
    'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
    'Ä': 'A', 'Ö': 'O', 'Ü': 'U',
    'à': 'a', 'â': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'î': 'i', 'ï': 'i', 'ô': 'o', 'ù': 'u', 'û': 'u', 'ç': 'c',
    'À': 'A', 'Â': 'A', 'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'Î': 'I', 'Ï': 'I', 'Ô': 'O', 'Ù': 'U', 'Û': 'U', 'Ç': 'C',
  }
  return text.split('').map(char => map[char] || char).join('')
}

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

export async function GET(request: NextRequest) {
  try {
    const quoteId = request.nextUrl.searchParams.get('id')
    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote id' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: quote } = await supabase
      .from('qs_quotes')
      .select(`
        *,
        qs_quote_requests (
          client_name,
          client_email,
          client_phone
        )
      `)
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single()

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, country')
      .eq('id', user.id)
      .single()

    const contractorName = toAscii(profile?.company_name || profile?.full_name || 'Contractor')
    const clientName = toAscii(quote.qs_quote_requests?.client_name || 'Client')
    const countryCode = profile?.country || 'US'
    const countryConfig = COUNTRIES[countryCode] || COUNTRIES.US
    const cs = getCurrencySymbol(quote.currency || 'USD')

    const items: QuoteItem[] = Array.isArray(quote.items)
      ? quote.items
      : typeof quote.items === 'string'
        ? JSON.parse(quote.items)
        : []

    const subtotal = Number(quote.subtotal) || 0
    const discountPercent = Number(quote.discount_percent) || 0
    const vatPercent = Number(quote.vat_percent) || 0
    const totalNet = Number(quote.total_net) || 0
    const totalGross = Number(quote.total_gross) || Number(quote.total) || 0

    // Generate PDF
    const doc = new jsPDF()

    // Header
    doc.setFillColor(30, 58, 95)
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('BrickQuote', 20, 20)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Quote', 190, 20, { align: 'right' })

    // Contractor & Client
    let y = 45
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Contractor:', 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(contractorName, 20, y + 6)

    doc.setFont('helvetica', 'bold')
    doc.text('Client:', 120, y)
    doc.setFont('helvetica', 'normal')
    doc.text(clientName, 120, y + 6)
    if (quote.qs_quote_requests?.client_phone) {
      doc.text(`Tel: ${quote.qs_quote_requests.client_phone}`, 120, y + 12)
    }
    if (quote.qs_quote_requests?.client_email) {
      doc.text(`Email: ${quote.qs_quote_requests.client_email}`, 120, y + 18)
    }

    // Dates
    y = 85
    doc.setTextColor(100, 100, 100)
    doc.text(`Quote date: ${new Date(quote.created_at).toLocaleDateString('en-US')}`, 20, y)
    if (quote.valid_until) {
      doc.text(`Valid until: ${new Date(quote.valid_until).toLocaleDateString('en-US')}`, 80, y)
    }
    if (quote.available_from) {
      doc.text(`Available from: ${new Date(quote.available_from).toLocaleDateString('en-US')}`, 140, y)
    }

    // Items table
    y = 100
    const tableData = items.map((item) => [
      toAscii(item.service_name || ''),
      `${Number(item.quantity) || 0} ${toAscii(item.unit || '')}`,
      `${cs}${(Number(item.unit_price) || 0).toFixed(2)}`,
      `${cs}${(Number(item.total) || 0).toFixed(2)}`,
    ])

    autoTable(doc, {
      startY: y,
      head: [['Service', 'Qty', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 95],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
    })

    // @ts-expect-error - autoTable adds lastAutoTable property
    y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY + 15 || y + 60

    const sx = 120
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text('Subtotal:', sx, y)
    doc.text(`${cs}${subtotal.toFixed(2)}`, 190, y, { align: 'right' })

    if (discountPercent > 0) {
      y += 7
      doc.text(`Discount (${discountPercent}%):`, sx, y)
      doc.setTextColor(220, 38, 38)
      doc.text(`-${cs}${(subtotal * discountPercent / 100).toFixed(2)}`, 190, y, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }

    if (vatPercent > 0) {
      y += 7
      doc.text('Net:', sx, y)
      doc.text(`${cs}${totalNet.toFixed(2)}`, 190, y, { align: 'right' })
      y += 7
      doc.text(`${countryConfig.taxLabel} (${vatPercent}%):`, sx, y)
      doc.text(`${cs}${(totalNet * vatPercent / 100).toFixed(2)}`, 190, y, { align: 'right' })
    }

    y += 10
    doc.setDrawColor(30, 58, 95)
    doc.setLineWidth(0.5)
    doc.line(120, y - 3, 190, y - 3)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 58, 95)
    doc.text('TOTAL:', 120, y + 2)
    doc.text(`${cs}${totalGross.toFixed(2)}`, 190, y + 2, { align: 'right' })

    // Notes
    const pdfNotes = quote.notes?.split('---CLIENT_ANSWER---')[0]?.trim()
    if (pdfNotes) {
      if (y > 240) { doc.addPage(); y = 20 } else { y += 20 }
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.text('Notes:', 20, y)
      doc.setFont('helvetica', 'normal')
      doc.text(doc.splitTextToSize(toAscii(pdfNotes), 170), 20, y + 6)
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    doc.setPage(pageCount)
    doc.setFontSize(10)
    doc.setTextColor(30, 58, 95)
    doc.setFont('helvetica', 'bold')
    doc.text('Thank you for your interest!', 105, 265, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('Quote generated by BrickQuote', 105, 280, { align: 'center' })
    doc.text('This quote is an estimate. Final price may vary after on-site assessment.', 105, 285, { align: 'center' })

    // Return PDF as binary
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const fileName = `quote-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
