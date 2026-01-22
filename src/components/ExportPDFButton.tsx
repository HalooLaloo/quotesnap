'use client'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
}

export function ExportPDFButton({ quote, contractorName }: ExportPDFButtonProps) {
  const handleExport = () => {
    const doc = new jsPDF()
    const clientName = quote.qs_quote_requests?.client_name || 'Client'

    // Header
    doc.setFontSize(24)
    doc.setTextColor(37, 99, 235) // blue-600
    doc.text('BrickQuote', 20, 25)

    doc.setFontSize(12)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text('Professional Quote', 20, 32)

    // Quote info
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105) // slate-600
    doc.text(`Quote #${quote.id.slice(0, 8).toUpperCase()}`, 140, 20)
    doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, 140, 26)
    if (quote.valid_until) {
      doc.text(`Valid until: ${new Date(quote.valid_until).toLocaleDateString()}`, 140, 32)
    }

    // Client info
    doc.setFontSize(12)
    doc.setTextColor(30, 41, 59) // slate-800
    doc.text('Quote for:', 20, 50)
    doc.setFontSize(14)
    doc.text(clientName, 20, 57)
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    if (quote.qs_quote_requests?.client_email) {
      doc.text(quote.qs_quote_requests.client_email, 20, 63)
    }
    if (quote.qs_quote_requests?.client_phone) {
      doc.text(quote.qs_quote_requests.client_phone, 20, 69)
    }

    // Contractor info
    if (contractorName) {
      doc.setFontSize(12)
      doc.setTextColor(30, 41, 59)
      doc.text('From:', 140, 50)
      doc.setFontSize(14)
      doc.text(contractorName, 140, 57)
    }

    // Items table
    const tableData = quote.items.map((item) => [
      item.service_name,
      `${item.quantity} ${item.unit}`,
      `${item.unit_price.toFixed(2)} PLN`,
      `${item.total.toFixed(2)} PLN`,
    ])

    autoTable(doc, {
      startY: 80,
      head: [['Service', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235], // blue-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
    })

    // Summary
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)

    let yPos = finalY

    // Subtotal
    doc.text('Subtotal:', 130, yPos)
    doc.text(`${quote.subtotal.toFixed(2)} PLN`, 190, yPos, { align: 'right' })
    yPos += 7

    // Discount
    if (quote.discount_percent > 0) {
      doc.text(`Discount (${quote.discount_percent}%):`, 130, yPos)
      doc.setTextColor(220, 38, 38) // red
      doc.text(`-${(quote.subtotal * quote.discount_percent / 100).toFixed(2)} PLN`, 190, yPos, { align: 'right' })
      doc.setTextColor(71, 85, 105)
      yPos += 7
    }

    // Net total
    if (quote.total_net) {
      doc.text('Net total:', 130, yPos)
      doc.text(`${quote.total_net.toFixed(2)} PLN`, 190, yPos, { align: 'right' })
      yPos += 7
    }

    // VAT
    if (quote.vat_percent && quote.vat_percent > 0) {
      doc.text(`VAT (${quote.vat_percent}%):`, 130, yPos)
      const vatAmount = (quote.total_gross || quote.total) - (quote.total_net || quote.subtotal)
      doc.text(`${vatAmount.toFixed(2)} PLN`, 190, yPos, { align: 'right' })
      yPos += 7
    }

    // Total
    yPos += 3
    doc.setDrawColor(37, 99, 235)
    doc.line(130, yPos - 3, 190, yPos - 3)

    doc.setFontSize(14)
    doc.setTextColor(30, 41, 59)
    doc.setFont(undefined as unknown as string, 'bold')
    doc.text('Total:', 130, yPos + 4)
    doc.text(`${(quote.total_gross || quote.total).toFixed(2)} PLN`, 190, yPos + 4, { align: 'right' })

    // Notes
    if (quote.notes) {
      yPos += 20
      doc.setFontSize(12)
      doc.setFont(undefined as unknown as string, 'normal')
      doc.text('Notes:', 20, yPos)
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)

      const splitNotes = doc.splitTextToSize(quote.notes, 170)
      doc.text(splitNotes, 20, yPos + 7)
    }

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184) // slate-400
    doc.text('Generated by BrickQuote', 105, 285, { align: 'center' })

    // Save
    doc.save(`quote-${clientName.toLowerCase().replace(/\s+/g, '-')}-${quote.id.slice(0, 8)}.pdf`)
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
