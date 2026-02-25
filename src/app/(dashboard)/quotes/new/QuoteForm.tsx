'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Service, UNITS, QuoteItem } from '@/lib/types'

export interface ExistingQuote {
  id: string
  token: string
  items: QuoteItem[]
  notes: string | null
  discount_percent: number
  vat_percent: number
  valid_until: string | null
  available_from: string | null
  status: string
}

interface QuoteFormProps {
  request: {
    id: string
    client_name: string
    description: string
  } | null
  services: Service[]
  userId: string
  currency: string
  currencySymbol: string
  taxLabel: string
  defaultTaxPercent: number
  profileComplete: boolean
  measurementSystem: 'imperial' | 'metric'
  contractorName: string
  contractorPhone: string
  existingQuote?: ExistingQuote
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

export function QuoteForm({ request, services, userId, currency, currencySymbol, taxLabel, defaultTaxPercent, profileComplete, measurementSystem, contractorName, contractorPhone, existingQuote }: QuoteFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditMode = !!existingQuote

  // Parse existing quote notes
  const existingNotes = existingQuote?.notes || ''
  const [existingGeneralNotes, existingClientAnswer] = existingNotes.split('---CLIENT_ANSWER---').map(s => s.trim())

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiNotes, setAiNotes] = useState<string | null>(null)
  const [aiLoaded, setAiLoaded] = useState(false)

  // Manual items (added by worker) — in edit mode, pre-fill with existing items
  const [manualItems, setManualItems] = useState<QuoteItem[]>(existingQuote?.items || [])

  const [clientAnswer, setClientAnswer] = useState(existingClientAnswer || '')
  const [discountPercent, setDiscountPercent] = useState(existingQuote?.discount_percent || 0)
  const [vatPercent, setVatPercent] = useState(existingQuote?.vat_percent ?? defaultTaxPercent)
  const [showVat, setShowVat] = useState((existingQuote?.vat_percent ?? defaultTaxPercent) > 0)
  const [validDays, setValidDays] = useState(2)
  const [availableFrom, setAvailableFrom] = useState(existingQuote?.available_from || '')
  const [personalMessage, setPersonalMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<'sent' | 'draft' | null>(null)
  const [requestExpanded, setRequestExpanded] = useState(false)

  const areaUnit = measurementSystem === 'imperial' ? 'sq ft' : 'm²'
  const unitOptions = measurementSystem === 'imperial'
    ? [
        { value: 'sq ft', label: 'sq ft' },
        { value: 'lf', label: 'lf' },
        { value: 'pcs', label: 'pcs' },
        { value: 'hr', label: 'hr' },
        { value: 'flat', label: 'flat' },
      ]
    : [
        { value: 'm²', label: 'm²' },
        { value: 'lf', label: 'lf' },
        { value: 'pcs', label: 'pcs' },
        { value: 'hr', label: 'hr' },
        { value: 'flat', label: 'flat' },
      ]

  // Custom service form state
  const [customService, setCustomService] = useState<CustomServiceForm>({
    name: '',
    quantity: 1,
    unit: areaUnit,
    unit_price: 0,
  })

  // Auto-load AI suggestions when page loads with request (not in edit mode)
  useEffect(() => {
    if (request?.description && !aiLoaded && !isEditMode) {
      loadAiSuggestions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

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
          measurementSystem,
        }),
      })

      const data = await response.json()

      if (response.status === 429) {
        setError('AI usage limit reached. Please try again later.')
      } else if (data.error) {
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

        // Mapuj custom sugestie (API may have matched some to price list)
        const customSuggestions: AiSuggestion[] = (data.customItems || []).map((item: QuoteItem & { reason?: string; isCustom?: boolean }) => ({
          service_name: item.service_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price || 0,
          total: item.total || 0,
          isCustom: item.isCustom !== false,
          reason: item.reason,
          selected: true,
        }))

        setAiSuggestions([...priceListSuggestions, ...customSuggestions])

        if (data.notes) {
          setAiNotes(data.notes)
        }
      }
    } catch (err) {
      console.error('AI suggest error:', err)
      setError('Failed to generate suggestions')
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
    const q = isNaN(quantity) ? 0 : quantity
    newSuggestions[index].quantity = q
    newSuggestions[index].total = q * (newSuggestions[index].unit_price || 0)
    setAiSuggestions(newSuggestions)
  }

  // Update AI suggestion price
  const updateSuggestionPrice = (index: number, price: number) => {
    const newSuggestions = [...aiSuggestions]
    const p = isNaN(price) ? 0 : price
    newSuggestions[index].unit_price = p
    newSuggestions[index].total = (newSuggestions[index].quantity || 0) * p
    setAiSuggestions(newSuggestions)
  }

  // Update AI suggestion service name
  const updateSuggestionName = (index: number, name: string) => {
    const newSuggestions = [...aiSuggestions]
    newSuggestions[index].service_name = name
    setAiSuggestions(newSuggestions)
  }

  // Update AI suggestion unit
  const updateSuggestionUnit = (index: number, unit: string) => {
    const newSuggestions = [...aiSuggestions]
    newSuggestions[index].unit = unit
    setAiSuggestions(newSuggestions)
  }

  // Remove AI suggestion completely
  const removeSuggestion = (index: number) => {
    setAiSuggestions(aiSuggestions.filter((_, i) => i !== index))
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
    const q = isNaN(quantity) ? 0 : quantity
    newItems[index].quantity = q
    newItems[index].total = q * (newItems[index].unit_price || 0)
    setManualItems(newItems)
  }

  // Aktualizuj cenę ręcznej pozycji
  const updateManualPrice = (index: number, price: number) => {
    const newItems = [...manualItems]
    const p = isNaN(price) ? 0 : price
    newItems[index].unit_price = p
    newItems[index].total = (newItems[index].quantity || 0) * p
    setManualItems(newItems)
  }

  // Usuń ręczną pozycję
  const removeManualItem = (index: number) => {
    setManualItems(manualItems.filter((_, i) => i !== index))
  }

  // Aktualizuj nazwę ręcznej pozycji
  const updateManualName = (index: number, name: string) => {
    const newItems = [...manualItems]
    newItems[index].service_name = name
    setManualItems(newItems)
  }

  // Aktualizuj jednostkę ręcznej pozycji
  const updateManualUnit = (index: number, unit: string) => {
    const newItems = [...manualItems]
    newItems[index].unit = unit
    setManualItems(newItems)
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
  const totalNet = subtotal - discount
  const vatAmount = showVat ? totalNet * (vatPercent / 100) : 0
  const totalGross = totalNet + vatAmount
  const total = showVat ? totalGross : totalNet

  // Track saved quote so we UPDATE instead of creating duplicates
  const [savedQuote, setSavedQuote] = useState<{ id: string; token: string } | null>(null)
  const effectiveEditMode = isEditMode || !!savedQuote
  const effectiveQuoteId = isEditMode ? existingQuote.id : savedQuote?.id
  const effectiveQuoteToken = isEditMode ? existingQuote.token : savedQuote?.token

  // Track which custom services were saved to price list
  const [savedToServices, setSavedToServices] = useState<Set<string>>(new Set())

  const [savingService, setSavingService] = useState<string | null>(null)

  const addToMyServices = async (name: string, unit: string, price: number) => {
    setSavingService(name)
    // Map display units back to DB format
    const unitMap: Record<string, string> = { 'sq ft': 'sqft', 'm²': 'm2', 'lf': 'lft' }
    const dbUnit = unitMap[unit] || unit
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user?.id || userId
      const { error: insertError } = await supabase
        .from('qs_services')
        .insert({ user_id: uid, name, unit: dbUnit, price })
      if (insertError) {
        console.error('Failed to save service:', insertError)
        setError(`Failed to save "${name}": ${insertError.message}`)
      } else {
        setSavedToServices(prev => new Set(prev).add(name))
      }
    } catch (err) {
      console.error('Failed to save service:', err)
      setError(`Failed to save "${name}" to price list`)
    } finally {
      setSavingService(null)
    }
  }

  // Preview overlay (no DB save — just shows what client will see)
  const [showPreview, setShowPreview] = useState(false)

  const handlePreview = () => {
    if (items.length === 0) {
      setError('Add at least one service to the quote')
      return
    }
    const customWithoutPrice = items.filter(i => i.isCustom && i.unit_price === 0)
    if (customWithoutPrice.length > 0) {
      setError('Enter price for all custom services')
      return
    }
    setError('')
    setShowPreview(true)
  }

  // Zapisz wycenę
  const handleSubmit = async (status: 'draft' | 'sent') => {
    if (items.length === 0) {
      setError('Add at least one service to the quote')
      return
    }

    // Sprawdź czy wszystkie custom items mają cenę
    const customWithoutPrice = items.filter(i => i.isCustom && i.unit_price === 0)
    if (customWithoutPrice.length > 0) {
      setError('Enter price for all custom services')
      return
    }

    // Wymagaj daty rozpoczęcia przy wysyłaniu
    if (status === 'sent' && !availableFrom) {
      setError('Select start date before sending')
      return
    }

    setError('')
    setLoading(true)

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validDays)

    const quoteData = {
      items: items,
      subtotal: subtotal,
      discount_percent: discountPercent,
      vat_percent: showVat ? vatPercent : 0,
      total_net: totalNet,
      total_gross: totalGross,
      total: total,
      notes: clientAnswer
        ? `---CLIENT_ANSWER---\n${clientAnswer}`
        : null,
      valid_until: validUntil.toISOString().split('T')[0],
      available_from: availableFrom || null,
      status: status,
      currency: currency,
    }

    let quoteId: string

    if (effectiveEditMode && effectiveQuoteId) {
      // UPDATE existing quote
      const { error: updateError } = await supabase
        .from('qs_quotes')
        .update({
          ...quoteData,
          ...(status === 'sent' && { sent_at: new Date().toISOString() }),
        })
        .eq('id', effectiveQuoteId)
        .eq('user_id', userId)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
      quoteId = effectiveQuoteId
    } else {
      // INSERT new quote
      const { data: insertedQuote, error: insertError } = await supabase
        .from('qs_quotes')
        .insert({
          ...quoteData,
          request_id: request?.id || null,
          user_id: userId,
          materials: [],
          sent_at: status === 'sent' ? new Date().toISOString() : null,
        })
        .select('id, token')
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
      quoteId = insertedQuote.id
      setSavedQuote({ id: insertedQuote.id, token: insertedQuote.token })
    }

    // Send email if status is 'sent'
    if (status === 'sent') {
      try {
        const response = await fetch('/api/send-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteId,
            ...(personalMessage.trim() && { personalMessage: personalMessage.trim() }),
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to send')
        }
      } catch (err) {
        console.error('Error sending quote:', err)
        setError('Quote saved but failed to send email')
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setSuccess(status)

    setTimeout(() => {
      router.push(`/quotes/${quoteId}`)
      router.refresh()
    }, 1500)
  }

  return (
    <div>
      {!profileComplete && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-amber-300 font-medium">Complete your profile before sending quotes</p>
              <p className="text-slate-400 text-sm mt-1">You need to add your name, company name, and phone number in Settings before you can send quotes to clients.</p>
              <a href="/settings" className="inline-flex items-center gap-1 mt-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-sm font-medium transition-colors">
                Go to Settings
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

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
                <h2 className="text-lg font-semibold text-white">Suggested Scope of Work</h2>
                <p className="text-slate-400 text-sm">Based on client conversation</p>
              </div>
              {aiLoaded && !aiLoading && (
                <button
                  onClick={loadAiSuggestions}
                  className="ml-auto text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
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
                  <span>AI analyzing client request...</span>
                </div>
              </div>
            ) : aiSuggestions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No AI suggestions - add services manually below</p>
                {services.length === 0 && (
                  <p className="text-sm mt-2">Tip: Add services to your price list for faster quoting</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-all ${
                      suggestion.selected
                        ? suggestion.isCustom
                          ? 'bg-amber-600/10 border-amber-500/40'
                          : 'bg-slate-700/50 border-slate-600'
                        : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                    }`}
                  >
                    {/* Header row: checkbox, name, delete */}
                    <div className="flex items-start gap-2 mb-2">
                      <button
                        onClick={() => toggleSuggestion(index)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
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

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={suggestion.service_name}
                          onChange={(e) => updateSuggestionName(index, e.target.value)}
                          disabled={!suggestion.selected}
                          className="w-full font-medium text-white text-sm bg-transparent border-none p-0 focus:ring-0"
                        />
                        {suggestion.reason && (
                          <p className="text-xs text-purple-400 mt-0.5">{suggestion.reason}</p>
                        )}
                      </div>

                      <button
                        onClick={() => removeSuggestion(index)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Values row: qty, unit, price, total */}
                    <div className="flex items-center gap-2 ml-7 flex-wrap">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={suggestion.quantity === 0 ? '' : suggestion.quantity}
                        onChange={(e) => updateSuggestionQuantity(index, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        disabled={!suggestion.selected}
                        className="input w-16 text-center text-sm py-1"
                      />
                      <select
                        value={suggestion.unit}
                        onChange={(e) => updateSuggestionUnit(index, e.target.value)}
                        disabled={!suggestion.selected}
                        className="input w-20 text-sm text-slate-400 py-1"
                      >
                        {unitOptions.map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                      <span className="text-slate-500 text-sm">×</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={suggestion.unit_price === 0 ? '' : suggestion.unit_price}
                        onChange={(e) => updateSuggestionPrice(index, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        disabled={!suggestion.selected}
                        placeholder="Price"
                        className={`input w-20 text-center text-sm py-1 ${
                          !suggestion.unit_price && suggestion.selected ? 'border-amber-500 bg-amber-500/10' : ''
                        }`}
                      />
                      <span className="text-slate-500 text-sm">=</span>
                      <span className="font-semibold text-white text-sm">
                        {currencySymbol}{suggestion.total.toFixed(0)}
                      </span>
                    </div>

                    {suggestion.isCustom && suggestion.selected && (
                      <div className="mt-2 ml-7 flex items-center gap-3">
                        {suggestion.unit_price === 0 && (
                          <span className="text-amber-400 text-xs flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Enter unit price
                          </span>
                        )}
                        {suggestion.unit_price > 0 && !savedToServices.has(suggestion.service_name) && !services.some(s => s.name === suggestion.service_name) && (
                          <button
                            type="button"
                            onClick={() => addToMyServices(suggestion.service_name, suggestion.unit, suggestion.unit_price)}
                            disabled={savingService === suggestion.service_name}
                            className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {savingService === suggestion.service_name ? (
                              <div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                            {savingService === suggestion.service_name ? 'Saving...' : 'Save to price list'}
                          </button>
                        )}
                        {savedToServices.has(suggestion.service_name) && (
                          <span className="text-green-400 text-xs flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {aiNotes && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-300">
                  <span className="text-purple-400 font-medium">AI Notes:</span> {aiNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Manual items added by worker */}
        {manualItems.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Added by You</h2>
            <div className="space-y-3">
              {manualItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    item.isCustom
                      ? 'bg-amber-600/10 border-amber-500/30'
                      : 'bg-slate-700/50 border-slate-600'
                  }`}
                >
                  {/* Header row: name, delete */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.service_name}
                        onChange={(e) => updateManualName(index, e.target.value)}
                        className="w-full font-medium text-white text-sm bg-transparent border-none p-0 focus:ring-0"
                      />
                    </div>
                    <button
                      onClick={() => removeManualItem(index)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Values row: qty, unit, price, total */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) => updateManualQuantity(index, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="input w-16 text-center text-sm py-1"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => updateManualUnit(index, e.target.value)}
                      className="input w-20 text-sm text-slate-400 py-1"
                    >
                      {unitOptions.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                    <span className="text-slate-500 text-sm">×</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.unit_price === 0 ? '' : item.unit_price}
                      onChange={(e) => updateManualPrice(index, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className={`input w-20 text-center text-sm py-1 ${
                        !item.unit_price ? 'border-amber-500 bg-amber-500/10' : ''
                      }`}
                    />
                    <span className="text-slate-500 text-sm">=</span>
                    <span className="font-semibold text-white text-sm">
                      {currencySymbol}{item.total.toFixed(0)}
                    </span>
                  </div>

                  {item.isCustom && !item.unit_price && (
                    <div className="mt-2 text-amber-400 text-xs flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Enter unit price
                    </div>
                  )}
                  {item.isCustom && item.unit_price > 0 && !savedToServices.has(item.service_name) && !services.some(s => s.name === item.service_name) && (
                    <button
                      type="button"
                      onClick={() => addToMyServices(item.service_name, item.unit, item.unit_price)}
                      disabled={savingService === item.service_name}
                      className="mt-2 text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {savingService === item.service_name ? (
                        <div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      {savingService === item.service_name ? 'Saving...' : 'Save to price list'}
                    </button>
                  )}
                  {item.isCustom && savedToServices.has(item.service_name) && (
                    <span className="mt-2 text-green-400 text-xs flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add your own services section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Add Your Services</h2>
          <p className="text-slate-400 text-sm mb-4">
            Add services that AI didn&apos;t suggest
          </p>

          {/* Services from price list */}
          {services.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">From Your Price List:</h3>
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
                        {currencySymbol}{service.price.toFixed(2)} / {UNITS[service.unit as keyof typeof UNITS]}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom service form */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Or add a custom service:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Service Name</label>
                <input
                  type="text"
                  value={customService.name}
                  onChange={(e) => setCustomService({ ...customService, name: e.target.value })}
                  placeholder="e.g. Crack repairs"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={customService.quantity === 0 ? '' : customService.quantity}
                  onChange={(e) => setCustomService({ ...customService, quantity: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0) })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Unit</label>
                <select
                  value={customService.unit}
                  onChange={(e) => setCustomService({ ...customService, unit: e.target.value })}
                  className="input"
                >
                  {unitOptions.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Unit Price ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customService.unit_price === 0 ? '' : customService.unit_price}
                  onChange={(e) => setCustomService({ ...customService, unit_price: e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0) })}
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
                    Add to Quote
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Client question & answer */}
        {request && (() => {
          const questionMatch = request.description.match(/QUESTION FOR CONTRACTOR:\s*([\s\S]+?)(?=\n\n|---CONVERSATION---|$)/)
          const clientQuestion = questionMatch?.[1]?.trim()

          if (clientQuestion) {
            return (
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4">Client&apos;s Question</h2>
                <div className="mb-4 p-3 bg-blue-600/10 rounded-lg border border-blue-500/30">
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{clientQuestion}</p>
                </div>
                <label className="label">Your answer (included in email only, not on PDF)</label>
                <textarea
                  value={clientAnswer}
                  onChange={(e) => setClientAnswer(e.target.value)}
                  className="input min-h-[80px] resize-y"
                  placeholder="Your answer to the client's question..."
                />
              </div>
            )
          }
          return null
        })()}

      </div>

      {/* Sidebar - Summary */}
      <div className="space-y-6">
        {/* Request info */}
        {request && (
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Client Request</h2>
            <p className="text-white font-medium">{request.client_name}</p>
            <button
              onClick={() => setRequestExpanded(!requestExpanded)}
              className="w-full text-left mt-2 group"
            >
              <p className={`text-slate-400 text-sm whitespace-pre-wrap ${requestExpanded ? '' : 'line-clamp-6'}`}>
                {request.description}
              </p>
              <span className="text-blue-400 text-xs mt-1 inline-flex items-center gap-1 group-hover:text-blue-300 transition-colors">
                {requestExpanded ? 'Show less' : 'Show full scope of work'}
                <svg className={`w-3 h-3 transition-transform ${requestExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
          </div>
        )}

        {/* Totals */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span>
              <span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Discount</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent === 0 ? '' : discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  className="input w-20 text-center text-sm"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            {discountPercent > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Discount Amount</span>
                <span>-{currencySymbol}{discount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-slate-700 pt-3">
              <div className="flex justify-between text-slate-300">
                <span>Net</span>
                <span>{currencySymbol}{totalNet.toFixed(2)}</span>
              </div>
            </div>

            {/* Tax (VAT/GST/Sales Tax) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showVat"
                  checked={showVat}
                  onChange={(e) => setShowVat(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="showVat" className="text-slate-300">{taxLabel}</label>
              </div>
              {showVat && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={vatPercent === 0 ? '' : vatPercent}
                    onChange={(e) => setVatPercent(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="input w-20 text-center text-sm"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              )}
            </div>

            {showVat && vatPercent > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>{taxLabel} ({vatPercent}%)</span>
                <span>+{currencySymbol}{vatAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-slate-700 pt-3">
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Estimate</span>
                <span>{currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              <p className="text-amber-300 text-xs flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                This is an estimated price. The final invoice amount may differ after an on-site inspection.
              </p>
            </div>
          </div>

          {/* Available from */}
          <div className="mt-6">
            <label className="label">Available Start Date</label>
            <input
              type="date"
              lang="en"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input"
            />
          </div>

          {/* Valid until */}
          <div className="mt-4">
            <label className="label">Quote Valid For (days)</label>
            <input
              type="number"
              min="1"
              value={validDays}
              onChange={(e) => setValidDays(parseInt(e.target.value) || 2)}
              className="input"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="card">
          {success && (
            <div className={`flex items-center gap-3 px-4 py-4 rounded-lg mb-4 ${
              success === 'sent' ? 'bg-green-600/20 border border-green-500/30' : 'bg-blue-600/20 border border-blue-500/30'
            }`}>
              <svg className={`w-6 h-6 ${success === 'sent' ? 'text-green-400' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className={`font-medium ${success === 'sent' ? 'text-green-400' : 'text-blue-400'}`}>
                  {success === 'sent'
                    ? (isEditMode ? 'Quote updated & sent!' : 'Quote sent to client!')
                    : (isEditMode ? 'Quote updated!' : 'Draft saved!')}
                </p>
                <p className="text-slate-400 text-sm">Redirecting...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {request && (
              <>
                <button
                  type="button"
                  onClick={() => setShowMessage(!showMessage)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="text-sm text-white">Personal Message</span>
                    <span className="text-slate-500 text-xs">(optional)</span>
                    <svg className={`w-3 h-3 text-slate-400 ml-auto transition-transform ${showMessage ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {showMessage && (
                  <textarea
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    className="input min-h-[70px] resize-y text-sm"
                    placeholder="Add a personal note to the email..."
                  />
                )}
                <button
                  onClick={() => handleSubmit('sent')}
                  disabled={loading || items.length === 0 || success !== null || !profileComplete}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send to Client
                    </>
                  )}
                </button>
              </>
            )}
            <button
              onClick={handlePreview}
              disabled={loading || items.length === 0 || success !== null || (!isEditMode && !profileComplete)}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Quote
            </button>
            <button
              onClick={() => handleSubmit('draft')}
              disabled={loading || items.length === 0 || success !== null || (!isEditMode && !profileComplete)}
              className={`${request ? 'btn-secondary' : 'btn-primary'} w-full`}
            >
              {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Full-screen preview overlay — exact client view, no DB save */}
    {showPreview && (() => {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + validDays)
      const effectiveVat = showVat ? vatPercent : 0

      return (
        <div className="fixed inset-0 z-[100] bg-[#0a1628] overflow-y-auto">
          <div className="py-8 px-4">
            <div className="max-w-3xl mx-auto">
              {/* Preview banner */}
              <div className="bg-amber-600 text-white px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="font-medium text-sm">Preview — this is what your client will see</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Edit Quote
                  </button>
                  <button
                    onClick={() => { setShowPreview(false); handleSubmit('sent') }}
                    disabled={!availableFrom}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white text-amber-700 hover:bg-white/90 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send to Client
                  </button>
                </div>
                {!availableFrom && (
                  <p className="text-amber-200 text-xs mt-2 text-center">Set a start date before sending</p>
                )}
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-[#132039] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="2" y="6" width="9" height="5" rx="0.5" />
                      <rect x="13" y="6" width="9" height="5" rx="0.5" />
                      <rect x="6" y="13" width="9" height="5" rx="0.5" />
                      <rect x="17" y="13" width="5" height="5" rx="0.5" />
                      <rect x="2" y="13" width="2" height="5" rx="0.5" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-white">BrickQuote</span>
                </div>
                <h1 className="text-3xl font-bold text-white">Quote from {contractorName || 'Contractor'}</h1>
                {request && <p className="text-slate-400 mt-2">For {request.client_name}</p>}
              </div>

              {/* Quote card */}
              <div className="card mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Quote Details</h2>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">Pending</span>
                </div>

                <div className="space-y-3 mb-6">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-white">{item.service_name}</span>
                        {item.reason && <p className="text-sm text-slate-400 mt-1">{item.reason}</p>}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-slate-400 text-sm">{item.quantity} {item.unit} x {currencySymbol}{item.unit_price.toFixed(2)}</div>
                        <div className="font-semibold text-white">{currencySymbol}{item.total.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Discount ({discountPercent}%)</span>
                      <span className="text-red-400">-{currencySymbol}{discount.toFixed(2)}</span>
                    </div>
                  )}
                  {effectiveVat > 0 && (
                    <>
                      <div className="flex justify-between text-slate-300">
                        <span>Net</span>
                        <span>{currencySymbol}{totalNet.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>{taxLabel} ({effectiveVat}%)</span>
                        <span>{currencySymbol}{vatAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-slate-700">
                    <span>Estimate</span>
                    <span>{currencySymbol}{total.toFixed(2)}</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">Price may vary slightly after on-site assessment</p>
                </div>
              </div>

              {/* Dates */}
              <div className="card mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Valid until</p>
                    <p className="text-white font-medium">{validUntil.toLocaleDateString()}</p>
                  </div>
                  {availableFrom && (
                    <div>
                      <p className="text-slate-400">Available from</p>
                      <p className="text-white font-medium">{new Date(availableFrom).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact */}
              {contractorPhone && (
                <div className="card mb-6">
                  <h3 className="font-medium text-white mb-3">Contact {contractorName}</h3>
                  <div className="btn-secondary w-full text-center flex items-center justify-center gap-2 pointer-events-none opacity-60">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {contractorPhone}
                  </div>
                </div>
              )}

              {/* Info box */}
              <div className="card mb-6 bg-blue-600/10 border-blue-500/30">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-slate-300 text-sm">
                    <strong className="text-blue-400">Note:</strong> This quote is an estimate prepared based on the provided description. The final price may vary slightly after an on-site assessment of the work scope.
                  </p>
                </div>
              </div>

              {/* Accept/Reject mockup (disabled) */}
              <div className="card mb-6 opacity-60">
                <h3 className="font-medium text-white mb-4 text-center">Your decision</h3>
                <div className="flex gap-4">
                  <button disabled className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                  <button disabled className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept Quote
                  </button>
                </div>
                <p className="text-slate-500 text-xs text-center mt-4">
                  By accepting, you agree to proceed with the work. The contractor will be notified.
                </p>
              </div>

              <p className="text-center text-slate-500 text-sm mt-8">Quote generated by BrickQuote</p>
            </div>
          </div>
        </div>
      )
    })()}

    </div>
  )
}
