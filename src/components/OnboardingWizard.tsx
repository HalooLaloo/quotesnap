'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UNITS } from '@/lib/types'

interface SuggestedService {
  name: string
  unit: 'm2' | 'mb' | 'szt' | 'godz' | 'ryczalt'
  price: number
  selected: boolean
}

type Step = 'welcome' | 'describe' | 'services' | 'share' | 'done'

const STEPS: Step[] = ['welcome', 'describe', 'services', 'share']

interface OnboardingWizardProps {
  onClose: () => void
  userId: string
}

export function OnboardingWizard({ onClose, userId }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [services, setServices] = useState<SuggestedService[]>([])
  const [customService, setCustomService] = useState<{ name: string; unit: 'm2' | 'mb' | 'szt' | 'godz' | 'ryczalt'; price: string }>({ name: '', unit: 'm2', price: '' })
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/request/${userId}`
    : ''

  const currentStepIndex = STEPS.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const handleAnalyze = async () => {
    if (description.trim().length < 10) {
      setError('Napisz trochę więcej o swojej pracy')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/suggest-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Wystąpił błąd')
      }

      setServices(
        data.services.map((s: { name: string; unit: string; price: number }) => ({
          ...s,
          selected: true,
        }))
      )
      setCurrentStep('services')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (index: number) => {
    setServices(prev =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    )
  }

  const updateServicePrice = (index: number, price: string) => {
    setServices(prev =>
      prev.map((s, i) => (i === index ? { ...s, price: parseFloat(price) || 0 } : s))
    )
  }

  const addCustomService = () => {
    if (!customService.name.trim()) return

    setServices(prev => [
      ...prev,
      {
        name: customService.name,
        unit: customService.unit,
        price: parseFloat(customService.price) || 0,
        selected: true,
      },
    ])
    setCustomService({ name: '', unit: 'm2', price: '' })
  }

  const handleSaveServices = async () => {
    const selectedServices = services.filter(s => s.selected)

    if (selectedServices.length === 0) {
      setError('Wybierz przynajmniej jedną usługę')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Nie jesteś zalogowany')
      }

      const { error: insertError } = await supabase
        .from('qs_services')
        .insert(
          selectedServices.map(s => ({
            user_id: user.id,
            name: s.name,
            unit: s.unit,
            price: s.price,
          }))
        )

      if (insertError) throw insertError

      setCurrentStep('share')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFinish = () => {
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Progress bar */}
        <div className="h-1 bg-slate-700">
          <div
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Welcome */}
          {currentStep === 'welcome' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="6" width="9" height="5" rx="0.5" />
                  <rect x="13" y="6" width="9" height="5" rx="0.5" />
                  <rect x="6" y="13" width="9" height="5" rx="0.5" />
                  <rect x="17" y="13" width="5" height="5" rx="0.5" />
                  <rect x="2" y="13" width="2" height="5" rx="0.5" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Witaj w BrickQuote!
              </h1>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                Za chwilę AI stworzy Twój cennik usług i będziesz gotowy do wysyłania profesjonalnych wycen.
              </p>
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Zajmie to około 2 minuty
              </div>
            </div>
          )}

          {/* Step 2: Describe */}
          {currentStep === 'describe' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Czym się zajmujesz?
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Opisz swoją działalność, a AI stworzy dla Ciebie cennik usług.
              </p>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Np. Jestem glazurnikiem z 10-letnim doświadczeniem. Kładę płytki w łazienkach i kuchniach, robię hydroizolacje, fuguję..."
                className="input min-h-[140px] resize-none mb-4"
                autoFocus
              />

              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span> Podpowiedź
                </p>
                <p className="text-slate-400 text-sm">
                  Im więcej napiszesz, tym lepiej AI dopasuje usługi. Wspomnij o: specjalizacjach, rodzajach prac, doświadczeniu.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Services */}
          {currentStep === 'services' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Twój cennik
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                AI zaproponowało te usługi. Dostosuj ceny do swoich stawek.
              </p>

              <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-colors ${
                      service.selected
                        ? 'bg-orange-600/10 border-orange-500/30'
                        : 'bg-slate-700/30 border-slate-600/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleService(index)}
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                          service.selected
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-600'
                        }`}
                      >
                        {service.selected && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${service.selected ? 'text-white' : 'text-slate-400'}`}>
                          {service.name}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-slate-500 text-xs">
                            {UNITS[service.unit]}
                          </span>
                          <input
                            type="number"
                            value={service.price || ''}
                            onChange={(e) => updateServicePrice(index, e.target.value)}
                            className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm text-right focus:border-orange-500 focus:outline-none"
                            placeholder="0"
                          />
                          <span className="text-slate-500 text-xs">zł</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add custom service */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-slate-400 text-xs mb-3">Brakuje usługi? Dodaj własną:</p>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={customService.name}
                    onChange={(e) => setCustomService(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nazwa usługi"
                    className="input flex-1 min-w-[120px] text-sm py-2"
                  />
                  <select
                    value={customService.unit}
                    onChange={(e) => setCustomService(prev => ({ ...prev, unit: e.target.value as 'm2' | 'mb' | 'szt' | 'godz' | 'ryczalt' }))}
                    className="input w-20 text-sm py-2"
                  >
                    {Object.entries(UNITS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={customService.price}
                    onChange={(e) => setCustomService(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Cena"
                    className="input w-16 text-sm py-2"
                  />
                  <button
                    onClick={addCustomService}
                    disabled={!customService.name.trim()}
                    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Share Link */}
          {currentStep === 'share' && (
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Cennik zapisany!
                </h2>
              </div>

              {/* How it works */}
              <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
                <p className="text-slate-300 text-sm font-medium mb-3">Jak to działa?</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs shrink-0">1</span>
                    <p className="text-slate-400">Wysyłasz link klientowi</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs shrink-0">2</span>
                    <p className="text-slate-400">Klient opisuje czego potrzebuje (zdjęcia, opis, wymiary)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs shrink-0">3</span>
                    <p className="text-slate-400">Zapytanie trafia do Ciebie w panelu</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs shrink-0">4</span>
                    <p className="text-slate-400">Tworzysz wycenę i wysyłasz do klienta</p>
                  </div>
                </div>
              </div>

              {/* Share URL */}
              <div className="bg-slate-900 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-400 text-white'
                    }`}
                  >
                    {copied ? 'Skopiowano!' : 'Kopiuj'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent('Wyślij zapytanie o wycenę: ' + shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href={`sms:?body=${encodeURIComponent('Wyślij zapytanie o wycenę: ' + shareUrl)}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    SMS
                  </a>
                </div>
              </div>

              <p className="text-slate-500 text-xs text-center">
                Link znajdziesz też w panelu, w zakładce "Zapytania"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700">
          {currentStep === 'welcome' && (
            <div className="flex justify-between items-center">
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
              >
                Pomiń na razie
              </button>
              <button
                onClick={() => setCurrentStep('describe')}
                className="btn-primary px-8"
              >
                Zaczynamy →
              </button>
            </div>
          )}

          {currentStep === 'describe' && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep('welcome')}
                className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
              >
                ← Wstecz
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading || description.trim().length < 10}
                className="btn-primary px-6"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI analizuje...
                  </span>
                ) : (
                  'Generuj cennik →'
                )}
              </button>
            </div>
          )}

          {currentStep === 'services' && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep('describe')}
                className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
              >
                ← Wstecz
              </button>
              <button
                onClick={handleSaveServices}
                disabled={loading || services.filter(s => s.selected).length === 0}
                className="btn-primary px-6"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Zapisuję...
                  </span>
                ) : (
                  `Zapisz ${services.filter(s => s.selected).length} usług →`
                )}
              </button>
            </div>
          )}

          {currentStep === 'share' && (
            <div className="flex justify-center">
              <button
                onClick={handleFinish}
                className="btn-primary px-8"
              >
                Przejdź do panelu →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
