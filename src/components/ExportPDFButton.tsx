'use client'

import { useState } from 'react'
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
    items: QuoteItem[] | string | null
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
  const [generating, setGenerating] = useState(false)

  const handleExport = () => {
    setGenerating(true)
    try {
      const doc = new jsPDF()
      const clientName = toAscii(quote.qs_quote_requests?.client_name || 'Client')
      const contractor = toAscii(contractorName || 'Contractor')

      // Parse items safely (could be string from DB)
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

      // Header - Slate blue
      doc.setFillColor(30, 58, 95)
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
      const tableData = items.map((item) => [
        toAscii(item.service_name || ''),
        `${Number(item.quantity) || 0} ${toAscii(item.unit || '')}`,
        `${(Number(item.unit_price) || 0).toFixed(2)}`,
        `${(Number(item.total) || 0).toFixed(2)}`,
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
      doc.text(`${subtotal.toFixed(2)}`, 190, y, { align: 'right' })

      // Discount
      if (discountPercent > 0) {
        y += 7
        doc.text(`Discount (${discountPercent}%):`, summaryX, y)
        doc.setTextColor(220, 38, 38)
        doc.text(`-${(subtotal * discountPercent / 100).toFixed(2)}`, 190, y, { align: 'right' })
        doc.setTextColor(0, 0, 0)
      }

      // Tax (VAT/GST/Sales Tax per country)
      if (vatPercent > 0) {
        y += 7
        doc.text('Net:', summaryX, y)
        doc.text(`${totalNet.toFixed(2)}`, 190, y, { align: 'right' })

        y += 7
        doc.text(`${countryConfig.taxLabel} (${vatPercent}%):`, summaryX, y)
        doc.text(`${(totalNet * vatPercent / 100).toFixed(2)}`, 190, y, { align: 'right' })
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
      doc.text(`${totalGross.toFixed(2)}`, 190, y + 2, { align: 'right' })
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

      // Save - use blob URL for better mobile compatibility
      const pdfBlob = doc.output('blob')
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `quote-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      alert(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={generating}
      className="btn-secondary flex items-center gap-2 disabled:opacity-50"
    >
      {generating ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </>
      )}
    </button>
  )
}
