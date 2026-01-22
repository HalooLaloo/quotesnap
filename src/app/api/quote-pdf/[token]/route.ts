import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { QuoteItem } from '@/lib/types'

// Force Node.js runtime for PDF generation
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    // Fetch quote data
    const { data: quote, error } = await supabase
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
      .eq('token', token)
      .single()

    if (error || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Get contractor info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, phone, email')
      .eq('id', quote.user_id)
      .single()

    const contractorName = profile?.company_name || profile?.full_name || 'Wykonawca'
    const clientName = quote.qs_quote_requests?.client_name || 'Klient'
    const items = (quote.items || []) as QuoteItem[]

    // Create PDF
    const doc = new jsPDF()

    // Header - Navy blue
    doc.setFillColor(37, 99, 235) // blue-600
    doc.rect(0, 0, 210, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('BrickQuote', 20, 25)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Wycena', 170, 25, { align: 'right' })

    // Quote info
    let y = 55
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)

    // Left column - Contractor
    doc.setFont('helvetica', 'bold')
    doc.text('Wykonawca:', 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(contractorName, 20, y + 6)
    if (profile?.phone) {
      doc.text(`Tel: ${profile.phone}`, 20, y + 12)
    }
    if (profile?.email) {
      doc.text(`Email: ${profile.email}`, 20, y + 18)
    }

    // Right column - Client
    doc.setFont('helvetica', 'bold')
    doc.text('Klient:', 120, y)
    doc.setFont('helvetica', 'normal')
    doc.text(clientName, 120, y + 6)
    if (quote.qs_quote_requests?.client_phone) {
      doc.text(`Tel: ${quote.qs_quote_requests.client_phone}`, 120, y + 12)
    }
    if (quote.qs_quote_requests?.client_email) {
      doc.text(`Email: ${quote.qs_quote_requests.client_email}`, 120, y + 18)
    }

    // Date info
    y = 95
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const createdDate = new Date(quote.created_at).toLocaleDateString('pl-PL')
    doc.text(`Data wyceny: ${createdDate}`, 20, y)

    if (quote.valid_until) {
      const validDate = new Date(quote.valid_until).toLocaleDateString('pl-PL')
      doc.text(`Wazna do: ${validDate}`, 80, y)
    }

    if (quote.available_from) {
      const availableDate = new Date(quote.available_from).toLocaleDateString('pl-PL')
      doc.text(`Dostepnosc od: ${availableDate}`, 140, y)
    }

    // Items table
    y = 110
    const tableData = items.map(item => [
      item.service_name,
      `${item.quantity} ${item.unit}`,
      `${item.unit_price.toFixed(2)} PLN`,
      `${item.total.toFixed(2)} PLN`
    ])

    autoTable(doc, {
      startY: y,
      head: [['Usluga', 'Ilosc', 'Cena jedn.', 'Wartosc']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246], // blue-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
    })

    // Summary section
    // @ts-expect-error - autoTable adds lastAutoTable property
    y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY + 15 || y + 60

    const summaryX = 130
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)

    // Subtotal
    doc.text('Suma:', summaryX, y)
    doc.text(`${quote.subtotal?.toFixed(2)} PLN`, 190, y, { align: 'right' })

    // Discount
    if (quote.discount_percent > 0) {
      y += 7
      doc.text(`Rabat (${quote.discount_percent}%):`, summaryX, y)
      doc.setTextColor(220, 38, 38) // red
      doc.text(`-${(quote.subtotal * quote.discount_percent / 100).toFixed(2)} PLN`, 190, y, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }

    // VAT
    if (quote.vat_percent > 0) {
      y += 7
      doc.text('Netto:', summaryX, y)
      doc.text(`${quote.total_net?.toFixed(2)} PLN`, 190, y, { align: 'right' })

      y += 7
      doc.text(`VAT (${quote.vat_percent}%):`, summaryX, y)
      doc.text(`${(quote.total_net * quote.vat_percent / 100).toFixed(2)} PLN`, 190, y, { align: 'right' })
    }

    // Total
    y += 10
    doc.setDrawColor(200, 200, 200)
    doc.line(summaryX, y - 3, 190, y - 3)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('RAZEM:', summaryX, y + 2)
    doc.text(`${(quote.total_gross || quote.total)?.toFixed(2)} PLN`, 190, y + 2, { align: 'right' })

    // Notes
    if (quote.notes) {
      y += 20
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Uwagi:', 20, y)
      doc.setFont('helvetica', 'normal')

      const splitNotes = doc.splitTextToSize(quote.notes, 170)
      doc.text(splitNotes, 20, y + 6)
    }

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Wycena wygenerowana przez BrickQuote', 105, 285, { align: 'center' })
    doc.text('Wycena ma charakter orientacyjny. Ostateczna cena moze roznic sie po ocenie zakresu prac na miejscu.', 105, 290, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="wycena-${clientName.replace(/\s+/g, '-')}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to generate PDF: ${errorMessage}` }, { status: 500 })
  }
}
