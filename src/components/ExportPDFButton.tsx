'use client'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { COUNTRIES } from '@/lib/countries'

// Transliterate Polish and other special characters to ASCII
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

interface QuoteItem {
  service_name: string
  quantity: number
  unit: string
  unit_price: number
  total: number
  isCustom?: boolean
}

interface ExportPDFButtonProps {
  quote: {
    id: string
    items: QuoteItem[]
    subtotal: number
    discount_percent: number
    vat_percent?: number
    total_net?: number
    total_gross?: number
    total: number
    notes?: string
    valid_until?: string
    available_from?: string
    created_at: string
    qs_quote_requests?: {
      client_name: string
      client_email?: string
      client_phone?: string
    }
  }
  contractorName?: string
  countryCode?: string
}

export function ExportPDFButton({ quote, contractorName, countryCode = 'US' }: ExportPDFButtonProps) {
  const countryConfig = COUNTRIES[countryCode] || COUNTRIES.US
  const handleExport = () => {
    const doc = new jsPDF()
    const clientName = toAscii(quote.qs_quote_requests?.client_name || 'Client')
    const contractor = toAscii(contractorName || 'Contractor')

    // Header - Slate blue
    doc.setFillColor(30, 58, 95) // #1e3a5f
    doc.rect(0, 0, 210, 30, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('BrickQuote', 20, 20)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Quote', 190, 20, { align: 'right' })

    // Quote info
    let y = 45
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)

    // Left column - Contractor
    doc.setFont('helvetica', 'bold')
    doc.text('Contractor:', 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(contractor, 20, y + 6)

    // Right column - Client
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

    // Date info
    y = 85
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const createdDate = new Date(quote.created_at).toLocaleDateString('en-US')
    doc.text(`Quote date: ${createdDate}`, 20, y)

    if (quote.valid_until) {
      const validDate = new Date(quote.valid_until).toLocaleDateString('en-US')
      doc.text(`Valid until: ${validDate}`, 80, y)
    }

    if (quote.available_from) {
      const availableDate = new Date(quote.available_from).toLocaleDateString('en-US')
      doc.text(`Available from: ${availableDate}`, 140, y)
    }

    // Items table
    y = 100
    const tableData = quote.items.map((item) => [
      toAscii(item.service_name),
      `${item.quantity} ${toAscii(item.unit)}`,
      `${item.unit_price.toFixed(2)}`,
      `${item.total.toFixed(2)}`,
    ])

    autoTable(doc, {
      startY: y,
      head: [['Service', 'Qty', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 95], // #1e3a5f
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

    // Summary
    // @ts-expect-error - autoTable adds lastAutoTable property
    y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY + 15 || y + 60

    const summaryX = 120
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)

    // Subtotal
    doc.text('Subtotal:', summaryX, y)
    doc.text(`${quote.subtotal.toFixed(2)}`, 190, y, { align: 'right' })

    // Discount
    if (quote.discount_percent > 0) {
      y += 7
      doc.text(`Discount (${quote.discount_percent}%):`, summaryX, y)
      doc.setTextColor(220, 38, 38)
      doc.text(`-${(quote.subtotal * quote.discount_percent / 100).toFixed(2)}`, 190, y, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }

    // Tax (VAT/GST/Sales Tax per country)
    if (quote.vat_percent && quote.vat_percent > 0) {
      y += 7
      doc.text('Net:', summaryX, y)
      doc.text(`${quote.total_net?.toFixed(2)}`, 190, y, { align: 'right' })

      y += 7
      doc.text(`${countryConfig.taxLabel} (${quote.vat_percent}%):`, summaryX, y)
      doc.text(`${((quote.total_net || 0) * quote.vat_percent / 100).toFixed(2)}`, 190, y, { align: 'right' })
    }

    // Total
    y += 10
    doc.setDrawColor(30, 58, 95)
    doc.setLineWidth(0.5)
    doc.line(120, y - 3, 190, y - 3)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 58, 95)
    doc.text('TOTAL:', 120, y + 2)
    doc.text(`${(quote.total_gross || quote.total).toFixed(2)}`, 190, y + 2, { align: 'right' })
    doc.setTextColor(0, 0, 0)

    // Notes (exclude client answer - only show general notes on PDF)
    const pdfNotes = quote.notes?.split('---CLIENT_ANSWER---')[0]?.trim()
    if (pdfNotes) {
      if (y > 240) {
        doc.addPage()
        y = 20
      } else {
        y += 20
      }

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Notes:', 20, y)
      doc.setFont('helvetica', 'normal')

      const splitNotes = doc.splitTextToSize(toAscii(pdfNotes), 170)
      doc.text(splitNotes, 20, y + 6)
    }

    // Thank you message
    const pageCount = doc.getNumberOfPages()
    doc.setPage(pageCount)

    doc.setFontSize(10)
    doc.setTextColor(30, 58, 95)
    doc.setFont('helvetica', 'bold')
    doc.text('Thank you for your interest!', 105, 265, { align: 'center' })

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('Quote generated by BrickQuote', 105, 280, { align: 'center' })
    doc.text('This quote is an estimate. Final price may vary after on-site assessment.', 105, 285, { align: 'center' })

    // Save
    doc.save(`quote-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  }

  return (
    <button
      onClick={handleExport}
      className="btn-secondary flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export PDF
    </button>
  )
}
