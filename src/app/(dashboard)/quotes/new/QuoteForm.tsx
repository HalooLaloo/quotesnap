'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Service, UNITS, QuoteItem } from '@/lib/types'

interface QuoteFormProps {
  request: {
    id: string
    client_name: string
    description: string
  } | null
  services: Service[]
  userId: string
}

export function QuoteForm({ request, services, userId }: QuoteFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [items, setItems] = useState<QuoteItem[]>([])
  const [notes, setNotes] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [validDays, setValidDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Dodaj usługę do wyceny
  const addService = (service: Service) => {
    const existing = items.find(i => i.service_name === service.name)
    if (existing) return

    setItems([
      ...items,
      {
        service_name: service.name,
        quantity: 1,
        unit: UNITS[service.unit as keyof typeof UNITS],
        unit_price: service.price,
        total: service.price,
      },
    ])
  }

  // Aktualizuj ilość
  const updateQuantity = (index: number, quantity: number) => {
    const newItems = [...items]
    newItems[index].quantity = quantity
    newItems[index].total = quantity * newItems[index].unit_price
    setItems(newItems)
  }

  // Usuń pozycję
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Oblicz sumy
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discount = subtotal * (discountPercent / 100)
  const total = subtotal - discount

  // Zapisz wycenę
  const handleSubmit = async (status: 'draft' | 'sent') => {
    if (items.length === 0) {
      setError('Add at least one service to the quote')
      return
    }

    setError('')
    setLoading(true)

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validDays)

    const { data, error: insertError } = await supabase
      .from('qs_quotes')
      .insert({
        request_id: request?.id || null,
        user_id: userId,
        items: items,
        materials: [],
        subtotal: subtotal,
        discount_percent: discountPercent,
        total: total,
        notes: notes || null,
        valid_until: validUntil.toISOString().split('T')[0],
        status: status,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Aktualizuj status zapytania
    if (request && status === 'sent') {
      await supabase
        .from('qs_quote_requests')
        .update({ status: 'quoted' })
        .eq('id', request.id)
    }

    router.push('/quotes')
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Services selection */}
      <div className="lg:col-span-2 space-y-6">
        {/* Add services */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Add Services</h2>

          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">You haven&apos;t added any services yet.</p>
              <a href="/services" className="btn-primary">
                Add Services First
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {services.map((service) => {
                const isAdded = items.some(i => i.service_name === service.name)
                return (
                  <button
                    key={service.id}
                    onClick={() => addService(service)}
                    disabled={isAdded}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      isAdded
                        ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-700/50 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-slate-400">
                      {service.price.toFixed(2)} PLN / {UNITS[service.unit as keyof typeof UNITS]}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Quote items */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Quote Items</h2>

          {items.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              Click on services above to add them to the quote
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-white">{item.service_name}</div>
                    <div className="text-sm text-slate-400">
                      {item.unit_price.toFixed(2)} PLN / {item.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0)}
                      className="input w-24 text-center"
                    />
                    <span className="text-slate-400 w-12">{item.unit}</span>
                  </div>
                  <div className="text-right w-28">
                    <div className="font-semibold text-white">
                      {item.total.toFixed(2)} PLN
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[100px] resize-y"
            placeholder="Additional notes for the client..."
          />
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-6">
        {/* Request info */}
        {request && (
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Request</h2>
            <p className="text-white font-medium">{request.client_name}</p>
            <p className="text-slate-400 text-sm mt-2 line-clamp-3">{request.description}</p>
          </div>
        )}

        {/* Totals */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)} PLN</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Discount</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="input w-20 text-center text-sm"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            {discountPercent > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Discount amount</span>
                <span>-{discount.toFixed(2)} PLN</span>
              </div>
            )}

            <div className="border-t border-slate-700 pt-3">
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Total</span>
                <span>{total.toFixed(2)} PLN</span>
              </div>
            </div>
          </div>

          {/* Valid until */}
          <div className="mt-6">
            <label className="label">Valid for (days)</label>
            <input
              type="number"
              min="1"
              value={validDays}
              onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
              className="input"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="card">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => handleSubmit('sent')}
              disabled={loading || items.length === 0}
              className="btn-primary w-full"
            >
              {loading ? 'Saving...' : 'Save & Send to Client'}
            </button>
            <button
              onClick={() => handleSubmit('draft')}
              disabled={loading || items.length === 0}
              className="btn-secondary w-full"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
