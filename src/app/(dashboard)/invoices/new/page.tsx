'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { UNITS, InvoiceItem, QuoteItem } from '@/lib/types'
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/countries'

function InvoiceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('from_quote')

  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(!!quoteId)
  const [error, setError] = useState('')

  // Currency from profile
  const [currency, setCurrency] = useState('USD')
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [taxLabel, setTaxLabel] = useState('Sales Tax')

  // Invoice data
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit: 'pcs', unit_price: 0, total: 0 }
  ])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [vatPercent, setVatPercent] = useState(23)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Bank transfer within 7 days')

  // Bank details (pre-filled from profile, editable per invoice)
  const [bankName, setBankName] = useState('')
  const [bankRouting, setBankRouting] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankRoutingLabel, setBankRoutingLabel] = useState('Routing Number')
  const [bankRoutingPlaceholder, setBankRoutingPlaceholder] = useState('e.g. 021000021')
  const [editingBank, setEditingBank] = useState(false)

  // Load user profile for currency settings
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('country, currency, bank_name, bank_account, bank_routing')
          .eq('id', user.id)
          .single()

        if (profile) {
          const countryCode = profile.country || DEFAULT_COUNTRY
          const country = COUNTRIES[countryCode] || COUNTRIES[DEFAULT_COUNTRY]
          setCurrency(profile.currency || country.currency)
          setCurrencySymbol(country.currencySymbol)
          setTaxLabel(country.taxLabel)
          setVatPercent(country.defaultTaxPercent)
          setBankRoutingLabel(country.bankRoutingLabel)
          setBankRoutingPlaceholder(country.bankRoutingPlaceholder)
          // Pre-fill bank details from profile
          if (profile.bank_name) setBankName(profile.bank_name)
          if (profile.bank_account) setBankAccount(profile.bank_account)
          if (profile.bank_routing) setBankRouting(profile.bank_routing)
        }
      }
    }
    loadProfile()
  }, [supabase])

  // Load quote data if from_quote param exists
  useEffect(() => {
    if (quoteId) {
      loadQuoteData(quoteId)
    }
  }, [quoteId])

  const loadQuoteData = async (qId: string) => {
    setLoadingQuote(true)
    try {
      const { data: quote, error: quoteError } = await supabase
        .from('qs_quotes')
        .select(`
          *,
          qs_quote_requests (
            client_name,
            client_email,
            client_phone,
            address
          )
        `)
        .eq('id', qId)
        .single()

      if (quoteError || !quote) {
        setError('Could not load quote data')
        return
      }

      // Fill form with quote data
      setClientName(quote.qs_quote_requests?.client_name || '')
      setClientEmail(quote.qs_quote_requests?.client_email || '')
      setClientPhone(quote.qs_quote_requests?.client_phone || '')
      setClientAddress(quote.qs_quote_requests?.address || '')
      setDiscountPercent(quote.discount_percent || 0)
      setVatPercent(quote.vat_percent || 23)
      // Convert quote items to invoice items
      const quoteItems = (quote.items || []) as QuoteItem[]
      if (quoteItems.length > 0) {
        setItems(quoteItems.map(item => ({
          description: item.service_name + (item.reason ? ` - ${item.reason}` : ''),
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total: item.total,
        })))
      }

      // Set due date to 7 days from now
      const due = new Date()
      due.setDate(due.getDate() + 7)
      setDueDate(due.toISOString().split('T')[0])

    } catch (err) {
      console.error('Error loading quote:', err)
      setError('Failed to load quote')
    } finally {
      setLoadingQuote(false)
    }
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = subtotal * (discountPercent / 100)
  const totalNet = subtotal - discountAmount
  const vatAmount = totalNet * (vatPercent / 100)
  const totalGross = totalNet + vatAmount

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }

      // Recalculate total for this item
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? Number(value) : updated[index].quantity
        const price = field === 'unit_price' ? Number(value) : updated[index].unit_price
        updated[index].total = qty * price
      }

      return updated
    })
  }

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unit: 'pcs', unit_price: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      setError('Client name is required')
      return
    }

    if (items.every(item => !item.description.trim())) {
      setError('Add at least one item')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in')
        return
      }

      // Get next invoice number
      const { data: profile } = await supabase
        .from('profiles')
        .select('invoice_counter')
        .eq('id', user.id)
        .single()

      const counter = (profile?.invoice_counter || 0) + 1
      const invoiceNumber = `INV-${String(counter).padStart(4, '0')}`

      // Update counter
      await supabase
        .from('profiles')
        .update({ invoice_counter: counter })
        .eq('id', user.id)

      // Filter out empty items
      const validItems = items.filter(item => item.description.trim())

      // Create invoice
      const { data: invoice, error: insertError } = await supabase
        .from('qs_invoices')
        .insert({
          user_id: user.id,
          quote_id: quoteId || null,
          invoice_number: invoiceNumber,
          items: validItems,
          subtotal,
          discount_percent: discountPercent,
          vat_percent: vatPercent,
          total_net: totalNet,
          total_gross: totalGross,
          due_date: dueDate || null,
          payment_terms: paymentTerms || null,
          status: 'draft',
          sent_at: null,
          client_name: clientName,
          client_email: clientEmail || null,
          client_phone: clientPhone || null,
          client_address: clientAddress || null,
          currency: currency,
          bank_name: bankName || null,
          bank_account: bankAccount || null,
          bank_routing: bankRouting || null,
          ...(invoiceDate ? { created_at: new Date(invoiceDate + 'T12:00:00').toISOString() } : {}),
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push(`/invoices/${invoice.id}`)
      router.refresh()

    } catch (err) {
      console.error('Error creating invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  if (loadingQuote) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading quote data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/invoices" className="text-slate-400 hover:text-white text-sm mb-2 inline-block">
          ← Back to Invoices
        </Link>
        <h1 className="text-3xl font-bold text-white">
          {quoteId ? 'Create Invoice from Quote' : 'New Invoice'}
        </h1>
        <p className="text-slate-400 mt-1">
          {quoteId ? 'Review and adjust items before creating the invoice.' : 'Create a new invoice for completed work.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {/* Client Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Client Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Client Name *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="input"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="input"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="input"
              placeholder="+1 234 567 890"
            />
          </div>
          <div>
            <label className="label">Address</label>
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className="input"
              placeholder="123 Main St, City"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Invoice Items</h2>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="label text-xs">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="input"
                    placeholder="Service or item description"
                  />
                </div>
                <div className="w-20">
                  <label className="label text-xs">Qty</label>
                  <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="input text-center"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="w-24">
                  <label className="label text-xs">Unit</label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    className="input"
                  >
                    {Object.entries(UNITS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="label text-xs">Unit Price</label>
                  <input
                    type="number"
                    value={item.unit_price || ''}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="input text-right"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="w-28">
                  <label className="label text-xs">Total</label>
                  <div className="input bg-slate-600 text-right text-white font-medium">
                    {item.total.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addItem}
          className="mt-4 text-blue-400 hover:text-orange-300 text-sm font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Pricing */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Pricing</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="label">Discount (%)</label>
            <input
              type="number"
              value={discountPercent || ''}
              onChange={(e) => setDiscountPercent(e.target.value === '' ? 0 : parseFloat(e.target.value))}
              className="input w-32"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="label">{taxLabel} (%)</label>
            <input
              type="number"
              value={vatPercent || ''}
              onChange={(e) => setVatPercent(e.target.value === '' ? 0 : parseFloat(e.target.value))}
              className="input w-32"
              min="0"
            />
          </div>
        </div>

        <div className="ml-auto w-full max-w-sm bg-slate-700/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-slate-300">
            <span>Subtotal</span>
            <span>{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-slate-300">
              <span>Discount ({discountPercent}%)</span>
              <span className="text-red-400">-{currencySymbol}{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-300">
            <span>Net</span>
            <span>{currencySymbol}{totalNet.toFixed(2)}</span>
          </div>
          {vatPercent > 0 && (
            <div className="flex justify-between text-slate-300">
              <span>{taxLabel} ({vatPercent}%)</span>
              <span>{currencySymbol}{vatAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-slate-600">
            <span>Total</span>
            <span>{currencySymbol}{totalGross.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Payment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Payment Terms</label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="input"
              placeholder="e.g. Bank transfer within 7 days"
            />
          </div>
        </div>

        {/* Bank Details */}
        <div className="border-t border-slate-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">Bank Details</h3>
            {!editingBank && (bankName || bankAccount || bankRouting) && (
              <button
                type="button"
                onClick={() => setEditingBank(true)}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {!editingBank && (bankName || bankAccount || bankRouting) ? (
            <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
              {bankName && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Bank</span>
                  <span className="text-white">{bankName}</span>
                </div>
              )}
              {bankRouting && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{bankRoutingLabel}</span>
                  <span className="text-white font-mono">{bankRouting}</span>
                </div>
              )}
              {bankAccount && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Account Number</span>
                  <span className="text-white font-mono">{bankAccount}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label text-xs">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="input"
                  placeholder="e.g. Bank of America"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">{bankRoutingLabel}</label>
                  <input
                    type="text"
                    value={bankRouting}
                    onChange={(e) => setBankRouting(e.target.value)}
                    className="input font-mono"
                    placeholder={bankRoutingPlaceholder}
                  />
                </div>
                <div>
                  <label className="label text-xs">Account Number</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="input font-mono"
                    placeholder="e.g. 12345678"
                  />
                </div>
              </div>
              {editingBank && (
                <button
                  type="button"
                  onClick={() => setEditingBank(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Done
                </button>
              )}
            </div>
          )}

          {!bankName && !bankAccount && !bankRouting && !editingBank && (
            <p className="text-slate-500 text-sm">
              No bank details set. <a href="/settings" className="text-blue-400 hover:text-blue-300">Add in Settings</a> or fill in above.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Link href="/invoices" className="btn-secondary flex-1 text-center">
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </div>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    }>
      <InvoiceForm />
    </Suspense>
  )
}
