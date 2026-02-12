'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UNITS } from '@/lib/types'
import { COUNTRIES, COUNTRY_LIST } from '@/lib/countries'

interface SuggestedService {
  name: string
  unit: 'm2' | 'mb' | 'pcs' | 'hr' | 'flat'
  price: number
  selected: boolean
}

type Step = 'welcome' | 'country' | 'describe' | 'services' | 'share' | 'done'

const STEPS: Step[] = ['welcome', 'country', 'describe', 'services', 'share']

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  AU: '🇦🇺',
  CA: '🇨🇦',
  IE: '🇮🇪',
  NZ: '🇳🇿',
}

interface OnboardingWizardProps {
  onClose: () => void
  userId: string
}

export function OnboardingWizard({ onClose, userId }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [services, setServices] = useState<SuggestedService[]>([])
  const [customService, setCustomService] = useState<{ name: string; unit: 'm2' | 'mb' | 'pcs' | 'hr' | 'flat'; price: string }>({ name: '', unit: 'm2', price: '' })
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/request/${userId}`
    : ''

  const currentStepIndex = STEPS.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const handleSaveCountry = async () => {
    if (!selectedCountry) {
      setError('Please select your country')
      return
    }

    setLoading(true)
    setError('')

    try {
      const country = COUNTRIES[selectedCountry]
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          country: selectedCountry,
          currency: country.currency,
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setCurrentStep('describe')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (description.trim().length < 10) {
      setError('Please write a bit more about your work')
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
        throw new Error(data.error || 'An error occurred')
      }

      if (!data.services || data.services.length === 0) {
        throw new Error('No services were generated. Please describe your work in more detail - mention specific tasks you do.')
      }

      setServices(
        data.services.map((s: { name: string; unit: string; price: number }) => ({
          ...s,
          selected: true,
        }))
      )
      setCurrentStep('services')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
      setError('Select at least one service')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in')
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

      // Mark onboarding as completed in localStorage
      localStorage.setItem(`onboarding_dismissed_${userId}`, 'true')

      setCurrentStep('share')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
    // Set flag for WhatsNextCard to show on requests page
    localStorage.setItem(`bq_show_whats_next_${userId}`, 'true')
    // First close (which also sets localStorage), then refresh
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#132039] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Progress bar */}
        <div className="h-1 bg-[#1e3a5f]">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
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
              <div className="w-20 h-20 bg-[#132039] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="6" width="9" height="5" rx="0.5" />
                  <rect x="13" y="6" width="9" height="5" rx="0.5" />
                  <rect x="6" y="13" width="9" height="5" rx="0.5" />
                  <rect x="17" y="13" width="5" height="5" rx="0.5" />
                  <rect x="2" y="13" width="2" height="5" rx="0.5" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Welcome to BrickQuote!
              </h1>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                AI will create your service price list and you&apos;ll be ready to send professional quotes.
              </p>
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Takes about 2 minutes
              </div>
            </div>
          )}

          {/* Step 2: Country Selection */}
          {currentStep === 'country' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Where are you located?
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                This determines your currency and tax settings.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {COUNTRY_LIST.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => setSelectedCountry(country.code)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedCountry === country.code
                        ? 'border-blue-500 bg-blue-600/10'
                        : 'border-[#1e3a5f] bg-[#1e3a5f]/30 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{COUNTRY_FLAGS[country.code]}</span>
                    <span className={`font-medium ${selectedCountry === country.code ? 'text-white' : 'text-slate-300'}`}>
                      {country.name}
                    </span>
                    <span className="text-slate-500 text-sm block mt-1">
                      {COUNTRIES[country.code].currencySymbol} {COUNTRIES[country.code].currency}
                    </span>
                  </button>
                ))}
              </div>

              {selectedCountry && (
                <div className="mt-6 bg-[#1e3a5f]/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">
                    <span className="text-white font-medium">{COUNTRIES[selectedCountry].taxLabel}</span> will be used for your quotes and invoices
                    {COUNTRIES[selectedCountry].taxIdRequired && (
                      <span> ({COUNTRIES[selectedCountry].taxIdLabel} required)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Describe */}
          {currentStep === 'describe' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                What do you do?
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Describe your work and AI will create a price list for you.
              </p>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., I'm a tile installer with 10 years of experience. I do bathroom and kitchen tiling, waterproofing, grouting..."
                className="input min-h-[140px] resize-none mb-4"
                autoFocus
              />

              <div className="bg-[#1e3a5f]/50 rounded-lg p-4">
                <p className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span> Tip
                </p>
                <p className="text-slate-400 text-sm">
                  The more detail you provide, the better AI will match services. Mention: specializations, types of work, experience.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Services */}
          {currentStep === 'services' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Your Price List
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                AI suggested these services. Adjust prices to your rates.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 mb-6">
                <p className="text-blue-300 text-xs">
                  These services are saved to your account. You can edit, add or remove them anytime from the &quot;My Services&quot; page.
                </p>
              </div>

              <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-colors ${
                      service.selected
                        ? 'bg-blue-600/10 border-blue-500/30'
                        : 'bg-[#1e3a5f]/30 border-slate-600/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleService(index)}
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                          service.selected
                            ? 'bg-blue-500 text-white'
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
                            className="w-20 bg-[#1e3a5f] border border-slate-600 rounded px-2 py-1 text-white text-sm text-right focus:border-blue-500 focus:outline-none"
                            placeholder="0"
                          />
                          <span className="text-slate-500 text-xs">
                            {selectedCountry ? COUNTRIES[selectedCountry].currencySymbol : '$'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add custom service */}
              <div className="border-t border-[#1e3a5f] pt-4">
                <p className="text-slate-400 text-xs mb-3">Missing a service? Add your own:</p>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={customService.name}
                    onChange={(e) => setCustomService(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Service name"
                    className="input flex-1 min-w-[120px] text-sm py-2"
                  />
                  <select
                    value={customService.unit}
                    onChange={(e) => setCustomService(prev => ({ ...prev, unit: e.target.value as 'm2' | 'mb' | 'pcs' | 'hr' | 'flat' }))}
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
                    placeholder="Price"
                    className="input w-16 text-sm py-2"
                  />
                  <button
                    onClick={addCustomService}
                    disabled={!customService.name.trim()}
                    className="bg-[#1e3a5f] hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Share Link */}
          {currentStep === 'share' && (
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Price list saved!
                </h2>
              </div>

              {/* How it works */}
              <div className="bg-[#1e3a5f]/30 rounded-xl p-4 mb-4">
                <p className="text-slate-300 text-sm font-medium mb-3">How it works</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0">1</span>
                    <p className="text-slate-400">Send this link to your client — no app needed, it works in any browser</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0">2</span>
                    <p className="text-slate-400">Client describes what they need (photos, description, measurements)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0">3</span>
                    <p className="text-slate-400">Request appears in your dashboard</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0">4</span>
                    <p className="text-slate-400">Create a quote and send it to the client</p>
                  </div>
                </div>
              </div>

              {/* Try it yourself - Tutorial */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-amber-300 font-medium text-sm mb-1">Try it yourself!</p>
                    <p className="text-slate-400 text-xs mb-3">
                      Click the preview button below, fill out a test request as if you were a client, and see how it appears in your dashboard. This is the best way to understand the full experience!
                    </p>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors text-xs font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start Test Request
                    </a>
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
                    className="flex-1 bg-[#132039] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-400 text-white'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Preview button */}
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview - See What Clients See
                </a>

                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent('Request a quote: ' + shareUrl)}`}
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
                    href={`sms:?body=${encodeURIComponent('Request a quote: ' + shareUrl)}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1e3a5f] hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    SMS
                  </a>
                </div>
              </div>

              <p className="text-slate-500 text-xs text-center">
                You can also find this link in your dashboard under &quot;Requests&quot;
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1e3a5f]">
          {currentStep === 'welcome' && (
            <div className="flex justify-between items-center">
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
              >
                Skip for now
              </button>
              <button
                onClick={() => setCurrentStep('country')}
                className="btn-primary px-8"
              >
                Let&apos;s go →
              </button>
            </div>
          )}

          {currentStep === 'country' && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep('welcome')}
                className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handleSaveCountry}
                disabled={loading || !selectedCountry}
                className="btn-primary px-6"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Continue →'
                )}
              </button>
            </div>
          )}

          {currentStep === 'describe' && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep('country')}
                className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading || description.trim().length < 10}
                className="btn-primary px-6"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI analyzing...
                  </span>
                ) : (
                  'Generate price list →'
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
                ← Back
              </button>
              <button
                onClick={handleSaveServices}
                disabled={loading || services.filter(s => s.selected).length === 0}
                className="btn-primary px-6"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  `Save ${services.filter(s => s.selected).length} services →`
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
                Go to dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
