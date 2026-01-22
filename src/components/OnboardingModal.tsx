'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UNITS } from '@/lib/types'

interface SuggestedService {
  name: string
  unit: 'm2' | 'mb' | 'szt' | 'godz' | 'ryczalt'
  price: number
  selected: boolean
}

interface OnboardingModalProps {
  onClose: () => void
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState<'describe' | 'select' | 'saving'>('describe')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [services, setServices] = useState<SuggestedService[]>([])
  const [customService, setCustomService] = useState<{ name: string; unit: 'm2' | 'mb' | 'szt' | 'godz' | 'ryczalt'; price: string }>({ name: '', unit: 'm2', price: '' })
  const router = useRouter()
  const supabase = createClient()

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

      setServices(
        data.services.map((s: { name: string; unit: string; price: number }) => ({
          ...s,
          selected: true,
        }))
      )
      setStep('select')
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

  const handleSave = async () => {
    const selectedServices = services.filter(s => s.selected)

    if (selectedServices.length === 0) {
      setError('Please select at least one service')
      return
    }

    setStep('saving')
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not logged in')
      }

      // Insert all selected services
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

      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStep('select')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">
            {step === 'describe' && '👋 Welcome to BrickQuote!'}
            {step === 'select' && '✨ Your Services'}
            {step === 'saving' && '💾 Saving...'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {step === 'describe' && 'Describe your work and we\'ll help create your price list'}
            {step === 'select' && 'Review and adjust your services, you can change prices'}
            {step === 'saving' && 'Saving your services...'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {step === 'describe' && (
            <div className="space-y-4">
              <div>
                <label className="label">Describe your business</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g. I'm a tiler with 10 years of experience. I install tiles in bathrooms and kitchens, also do waterproofing and finishing work..."
                  className="input min-h-[150px] resize-none"
                  autoFocus
                />
                <p className="text-slate-500 text-xs mt-2">
                  The more you write, the better we can suggest services
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-300 text-sm font-medium mb-2">💡 Tip</p>
                <p className="text-slate-400 text-sm">
                  Write about: your specializations, types of work you do,
                  whether you work with individual clients or companies,
                  your experience level.
                </p>
              </div>
            </div>
          )}

          {step === 'select' && (
            <div className="space-y-4">
              {/* Services list */}
              <div className="space-y-2">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      service.selected
                        ? 'bg-blue-600/10 border-blue-500/30'
                        : 'bg-slate-700/30 border-slate-600/30'
                    }`}
                  >
                    <button
                      onClick={() => toggleService(index)}
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        service.selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-600'
                      }`}
                    >
                      {service.selected && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${service.selected ? 'text-white' : 'text-slate-400'}`}>
                      {service.name}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {UNITS[service.unit]}
                    </span>
                    <input
                      type="number"
                      value={service.price || ''}
                      onChange={(e) => updateServicePrice(index, e.target.value)}
                      className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm text-right"
                      placeholder="0"
                    />
                    <span className="text-slate-400 text-xs">PLN</span>
                  </div>
                ))}
              </div>

              {/* Add custom service */}
              <div className="border-t border-slate-700 pt-4 mt-4">
                <p className="text-slate-300 text-sm font-medium mb-3">Add custom service</p>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={customService.name}
                    onChange={(e) => setCustomService(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Service name"
                    className="input flex-1 min-w-[150px]"
                  />
                  <select
                    value={customService.unit}
                    onChange={(e) => setCustomService(prev => ({ ...prev, unit: e.target.value as 'm2' | 'mb' | 'szt' | 'godz' | 'ryczalt' }))}
                    className="input w-24"
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
                    className="input w-20"
                  />
                  <button
                    onClick={addCustomService}
                    disabled={!customService.name.trim()}
                    className="btn-primary px-4"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'saving' && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-between gap-4">
          {step === 'describe' && (
            <>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading || description.trim().length < 10}
                className="btn-primary"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </span>
                ) : (
                  'Suggest Services →'
                )}
              </button>
            </>
          )}

          {step === 'select' && (
            <>
              <button
                onClick={() => setStep('describe')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary"
                >
                  Save {services.filter(s => s.selected).length} services
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
