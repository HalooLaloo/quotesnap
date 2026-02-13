import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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
  }
  return text.split('').map(char => map[char] || char).join('')
}

function getCurrencySymbol(currencyCode: string): string {
  const country = Object.values(COUNTRIES).find(c => c.currency === currencyCode)
  return country?.currencySymbol || currencyCode
}

export default async function QuotePDFPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: quote } = await supabase
    .from('qs_quotes')
    .select(`*, qs_quote_requests(client_name, client_email, client_phone)`)
    .eq('id', id)
    .eq('user_id', user?.id)
    .single()

  if (!quote) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name, country')
    .eq('id', user?.id)
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

  // Generate PDF server-side
  const doc = new jsPDF()

  doc.setFillColor(30, 58, 95)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('BrickQuote', 20, 20)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Quote', 190, 20, { align: 'right' })

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
  if (quote.qs_quote_requests?.client_phone) doc.text(`Tel: ${quote.qs_quote_requests.client_phone}`, 120, y + 12)
  if (quote.qs_quote_requests?.client_email) doc.text(`Email: ${quote.qs_quote_requests.client_email}`, 120, y + 18)

  y = 85
  doc.setTextColor(100, 100, 100)
  doc.text(`Quote date: ${new Date(quote.created_at).toLocaleDateString('en-US')}`, 20, y)
  if (quote.valid_until) doc.text(`Valid until: ${new Date(quote.valid_until).toLocaleDateString('en-US')}`, 80, y)
  if (quote.available_from) doc.text(`Available from: ${new Date(quote.available_from).toLocaleDateString('en-US')}`, 140, y)

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
    headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' } },
  })

  // @ts-expect-error - autoTable adds lastAutoTable
  y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY + 15 || y + 60
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text('Subtotal:', 120, y)
  doc.text(`${cs}${subtotal.toFixed(2)}`, 190, y, { align: 'right' })
  if (discountPercent > 0) {
    y += 7
    doc.text(`Discount (${discountPercent}%):`, 120, y)
    doc.setTextColor(220, 38, 38)
    doc.text(`-${cs}${(subtotal * discountPercent / 100).toFixed(2)}`, 190, y, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
  if (vatPercent > 0) {
    y += 7
    doc.text('Net:', 120, y)
    doc.text(`${cs}${totalNet.toFixed(2)}`, 190, y, { align: 'right' })
    y += 7
    doc.text(`${countryConfig.taxLabel} (${vatPercent}%):`, 120, y)
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

  // Convert to base64 data URI
  const pdfBase64 = doc.output('datauristring')

  return (
    <div className="p-4 md:p-8">
      <Link
        href={`/quotes/${id}`}
        className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Quote
      </Link>

      <div className="card mt-4">
        <h1 className="text-xl font-bold text-white mb-4">
          PDF — {clientName}
        </h1>

        {/* PDF preview in iframe */}
        <iframe
          src={pdfBase64}
          className="w-full h-[70vh] rounded-lg border border-slate-700 bg-white mb-4"
          title="Quote PDF"
        />

        <p className="text-slate-500 text-xs text-center">
          If the PDF doesn&apos;t show above, use the link below to open it directly.
        </p>

        {/* Direct data URI link as fallback */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href={pdfBase64}
          download={`quote-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`}
          className="btn-primary w-full text-center flex items-center justify-center gap-2 mt-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Save PDF
        </a>
      </div>
    </div>
  )
}
