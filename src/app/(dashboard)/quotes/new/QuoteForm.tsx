'use client'

import { useState, useEffect } from 'react'
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

interface CustomServiceForm {
  name: string
  quantity: number
  unit: string
  unit_price: number
}

interface AiSuggestion extends QuoteItem {
  selected: boolean
}

export function QuoteForm({ request, services, userId }: QuoteFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiNotes, setAiNotes] = useState<string | null>(null)
  const [aiLoaded, setAiLoaded] = useState(false)

  // Manual items (added by worker)
  const [manualItems, setManualItems] = useState<QuoteItem[]>([])

  const [notes, setNotes] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [validDays, setValidDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Custom service form state
  const [customService, setCustomService] = useState<CustomServiceForm>({
    name: '',
    quantity: 1,
    unit: 'm²',
    unit_price: 0,
  })

  // Auto-load AI suggestions when page loads with request
  useEffect(() => {
    if (request?.description && services.length > 0 && !aiLoaded) {
      loadAiSuggestions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, services])

  // Load AI suggestions
  const loadAiSuggestions = async () => {
    if (!request?.description) return

    setAiLoading(true)
    setError('')
    setAiNotes(null)

    try {
      const response = await fetch('/api/suggest-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: request.description,
          services: services.map(s => ({
            name: s.name,
            price: s.price,
            unit: UNITS[s.unit as keyof typeof UNITS],
          })),
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        // Mapuj sugestie z cennika
        const priceListSuggestions: AiSuggestion[] = (data.items || []).map((item: QuoteItem & { reason?: string }) => ({
          service_name: item.service_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total: item.total,
          isCustom: false,
          reason: item.reason,
          selected: true, // domyślnie zaznaczone
        }))

        // Mapuj custom sugestie (usługi spoza cennika)
        const customSuggestions: AiSuggestion[] = (data.customItems || []).map((item: QuoteItem & { reason?: string }) => ({
          service_name: item.service_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: 0, // Worker wpisze cenę
          total: 0,
          isCustom: true,
          reason: item.reason,
          selected: true, // domyślnie zaznaczone
        }))

        setAiSuggestions([...priceListSuggestions, ...customSuggestions])

        if (data.notes) {
          setAiNotes(data.notes)
        }
      }
    } catch (err) {
      console.error('AI suggest error:', err)
      setError('Nie udało się wygenerować sugestii')
    }

    setAiLoading(false)
    setAiLoaded(true)
  }

  // Toggle AI suggestion selection
  const toggleSuggestion = (index: number) => {
    const newSuggestions = [...aiSuggestions]
    newSuggestions[index].selected = !newSuggestions[index].selected
    setAiSuggestions(newSuggestions)
  }

  // Update AI suggestion quantity
  const updateSuggestionQuantity = (index: number, quantity: number) => {
    const newSuggestions = [...aiSuggestions]
    newSuggestions[index].quantity = quantity
    newSuggestions[index].total = quantity * newSuggestions[index].unit_price
    setAiSuggestions(newSuggestions)
  }

  // Update AI suggestion price (for custom items)
  const updateSuggestionPrice = (index: number, price: number) => {
    const newSuggestions = [...aiSuggestions]
    newSuggestions[index].unit_price = price
    newSuggestions[index].total = newSuggestions[index].quantity * price
    setAiSuggestions(newSuggestions)
  }

  // Dodaj usługę z cennika do ręcznych pozycji
  const addService = (service: Service) => {
    const existsInSuggestions = aiSuggestions.some(s => s.service_name === service.name && s.selected)
    const existsInManual = manualItems.some(i => i.service_name === service.name)
    if (existsInSuggestions || existsInManual) return

    setManualItems([
      ...manualItems,
      {
        service_name: service.name,
        quantity: 1,
        unit: UNITS[service.unit as keyof typeof UNITS],
        unit_price: service.price,
        total: service.price,
      },
    ])
  }

  // Aktualizuj ilość ręcznej pozycji
  const updateManualQuantity = (index: number, quantity: number) => {
    const newItems = [...manualItems]
    newItems[index].quantity = quantity
    newItems[index].total = quantity * newItems[index].unit_price
    setManualItems(newItems)
  }

  // Aktualizuj cenę ręcznej pozycji
  const updateManualPrice = (index: number, price: number) => {
    const newItems = [...manualItems]
    newItems[index].unit_price = price
    newItems[index].total = newItems[index].quantity * price
    setManualItems(newItems)
  }

  // Usuń ręczną pozycję
  const removeManualItem = (index: number) => {
    setManualItems(manualItems.filter((_, i) => i !== index))
  }

  // Dodaj własną usługę (custom)
  const addCustomService = () => {
    if (!customService.name.trim()) return

    setManualItems([
      ...manualItems,
      {
        service_name: customService.name,
        quantity: customService.quantity,
        unit: customService.unit,
        unit_price: customService.unit_price,
        total: customService.quantity * customService.unit_price,
        isCustom: true,
      },
    ])

    setCustomService({
      name: '',
      quantity: 1,
      unit: 'm²',
      unit_price: 0,
    })
  }

  // Combine selected AI suggestions + manual items for final quote
  const getSelectedItems = (): QuoteItem[] => {
    const selectedAi = aiSuggestions
      .filter(s => s.selected)
      .map((s): QuoteItem => ({
        service_name: s.service_name,
        quantity: s.quantity,
        unit: s.unit,
        unit_price: s.unit_price,
        total: s.total,
        isCustom: s.isCustom,
        reason: s.reason,
      }))
    return [...selectedAi, ...manualItems]
  }

  const items = getSelectedItems()

  // Oblicz sumy
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discount = subtotal * (discountPercent / 100)
  const total = subtotal - discount

  // Zapisz wycenę
  const handleSubmit = async (status: 'draft' | 'sent') => {
    if (items.length === 0) {
      setError('Dodaj przynajmniej jedną usługę do wyceny')
      return
    }

    // Sprawdź czy wszystkie custom items mają cenę
    const customWithoutPrice = items.filter(i => i.isCustom && i.unit_price === 0)
    if (customWithoutPrice.length > 0) {
      setError('Uzupełnij cenę dla wszystkich usług spoza cennika')
      return
    }

    setError('')
    setLoading(true)

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validDays)

    // Zapisz wycenę i pobierz jej ID
    const { data: insertedQuote, error: insertError } = await supabase
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
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Aktualizuj status zapytania i wyślij email jeśli status = sent
    if (request && status === 'sent') {
      await supabase
        .from('qs_quote_requests')
        .update({ status: 'quoted' })
        .eq('id', request.id)

      // Wyślij email do klienta
      try {
        const emailResponse = await fetch('/api/send-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId: insertedQuote.id }),
        })

        if (!emailResponse.ok) {
          const emailData = await emailResponse.json()
          console.error('Email send error:', emailData.error)
          // Nie przerywamy - wycena jest zapisana, tylko mail nie doszedł
        }
      } catch (emailError) {
        console.error('Email send error:', emailError)
      }
    }

    router.push('/quotes')
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* AI Suggestions Section */}
        {request && (
          <div className="card bg-purple-600/10 border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Proponowany zakres prac</h2>
                <p className="text-slate-400 text-sm">Na podstawie rozmowy z klientem</p>
              </div>
              {aiLoaded && !aiLoading && (
                <button
                  onClick={loadAiSuggestions}
                  className="ml-auto text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Odśwież
                </button>
              )}
            </div>

            {aiLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-purple-400">
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>AI analizuje zapytanie klienta...</span>
                </div>
              </div>
            ) : aiSuggestions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                {services.length === 0 ? (
                  <p>Najpierw dodaj usługi do cennika</p>
                ) : (
                  <p>Brak sugestii AI - dodaj usługi ręcznie poniżej</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all ${
                      suggestion.selected
                        ? suggestion.isCustom
                          ? 'bg-amber-600/10 border-amber-500/40'
                          : 'bg-slate-700/50 border-slate-600'
                        : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSuggestion(index)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          suggestion.selected
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-slate-500 hover:border-slate-400'
                        }`}
                      >
                        {suggestion.selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Service info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">{suggestion.service_name}</span>
                          {suggestion.isCustom && (
                            <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                              Spoza cennika
                            </span>
                          )}
                        </div>
                        {suggestion.reason && (
                          <p className="text-sm text-purple-400 mt-1">{suggestion.reason}</p>
                        )}
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={suggestion.quantity}
                          onChange={(e) => updateSuggestionQuantity(index, parseFloat(e.target.value) || 0)}
                          disabled={!suggestion.selected}
                          className="input w-20 text-center text-sm"
                        />
                        <span className="text-slate-400 text-sm w-12">{suggestion.unit}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-slate-500 text-sm">×</span>
                        {suggestion.isCustom ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={suggestion.unit_price}
                            onChange={(e) => updateSuggestionPrice(index, parseFloat(e.target.value) || 0)}
                            disabled={!suggestion.selected}
                            placeholder="Cena"
                            className={`input w-24 text-center text-sm ${
                              suggestion.unit_price === 0 && suggestion.selected ? 'border-amber-500 bg-amber-500/10' : ''
                            }`}
                          />
                        ) : (
                          <span className="text-slate-300 w-24 text-center text-sm">
                            {suggestion.unit_price.toFixed(0)} PLN
                          </span>
                        )}
                      </div>

                      <div className="text-right w-28 shrink-0">
                        <div className="font-semibold text-white">
                          {suggestion.total.toFixed(2)} PLN
                        </div>
                      </div>
                    </div>

                    {suggestion.isCustom && suggestion.unit_price === 0 && suggestion.selected && (
                      <div className="mt-2 ml-8 text-amber-400 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Wpisz cenę za jednostkę
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {aiNotes && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-300">
                  <span className="text-purple-400 font-medium">Uwagi AI:</span> {aiNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Manual items added by worker */}
        {manualItems.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Dodane przez Ciebie</h2>
            <div className="space-y-3">
              {manualItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    item.isCustom
                      ? 'bg-amber-600/10 border border-amber-500/30'
                      : 'bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{item.service_name}</span>
                        {item.isCustom && (
                          <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => updateManualQuantity(index, parseFloat(e.target.value) || 0)}
                        className="input w-20 text-center text-sm"
                      />
                      <span className="text-slate-400 w-12 text-sm">{item.unit}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-sm">×</span>
                      {item.isCustom ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.unit_price}
                          onChange={(e) => updateManualPrice(index, parseFloat(e.target.value) || 0)}
                          className={`input w-24 text-center text-sm ${
                            item.unit_price === 0 ? 'border-amber-500 bg-amber-500/10' : ''
                          }`}
                        />
                      ) : (
                        <span className="text-slate-300 w-24 text-center text-sm">
                          {item.unit_price.toFixed(0)} PLN
                        </span>
                      )}
                    </div>
                    <div className="text-right w-28">
                      <div className="font-semibold text-white">
                        {item.total.toFixed(2)} PLN
                      </div>
                    </div>
                    <button
                      onClick={() => removeManualItem(index)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add your own services section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Dodaj własne usługi</h2>
          <p className="text-slate-400 text-sm mb-4">
            Dodaj usługi, których AI nie zaproponowało
          </p>

          {/* Services from price list */}
          {services.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Z Twojego cennika:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map((service) => {
                  const isInSuggestions = aiSuggestions.some(s => s.service_name === service.name && s.selected)
                  const isInManual = manualItems.some(i => i.service_name === service.name)
                  const isAdded = isInSuggestions || isInManual
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
            </div>
          )}

          {/* Custom service form */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Lub dodaj usługę spoza cennika:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nazwa usługi</label>
                <input
                  type="text"
                  value={customService.name}
                  onChange={(e) => setCustomService({ ...customService, name: e.target.value })}
                  placeholder="np. Naprawa pęknięć"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Ilość</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={customService.quantity}
                  onChange={(e) => setCustomService({ ...customService, quantity: parseFloat(e.target.value) || 1 })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Jednostka</label>
                <select
                  value={customService.unit}
                  onChange={(e) => setCustomService({ ...customService, unit: e.target.value })}
                  className="input"
                >
                  <option value="m²">m²</option>
                  <option value="mb">mb</option>
                  <option value="szt.">szt.</option>
                  <option value="godz.">godz.</option>
                  <option value="ryczałt">ryczałt</option>
                </select>
              </div>
              <div>
                <label className="label">Cena za jednostkę (PLN)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customService.unit_price}
                  onChange={(e) => setCustomService({ ...customService, unit_price: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addCustomService}
                  disabled={!customService.name.trim()}
                  className="btn-secondary w-full"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Dodaj do wyceny
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Uwagi</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[100px] resize-y"
            placeholder="Dodatkowe uwagi dla klienta..."
          />
        </div>
      </div>

      {/* Sidebar - Summary */}
      <div className="space-y-6">
        {/* Request info */}
        {request && (
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Zapytanie klienta</h2>
            <p className="text-white font-medium">{request.client_name}</p>
            <p className="text-slate-400 text-sm mt-2 whitespace-pre-wrap line-clamp-6">{request.description}</p>
          </div>
        )}

        {/* Totals */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Podsumowanie</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-slate-300">
              <span>Suma częściowa</span>
              <span>{subtotal.toFixed(2)} PLN</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Rabat</span>
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
                <span>Kwota rabatu</span>
                <span>-{discount.toFixed(2)} PLN</span>
              </div>
            )}

            <div className="border-t border-slate-700 pt-3">
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Razem</span>
                <span>{total.toFixed(2)} PLN</span>
              </div>
            </div>
          </div>

          {/* Valid until */}
          <div className="mt-6">
            <label className="label">Ważność wyceny (dni)</label>
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
              {loading ? 'Zapisywanie...' : 'Wyślij do klienta'}
            </button>
            <button
              onClick={() => handleSubmit('draft')}
              disabled={loading || items.length === 0}
              className="btn-secondary w-full"
            >
              Zapisz jako szkic
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
