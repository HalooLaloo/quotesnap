'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

export default function ClientRequestPage() {
  const params = useParams()
  const contractorId = params.userId as string
  const supabase = createClient()

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    address: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase
      .from('qs_quote_requests')
      .insert({
        contractor_id: contractorId,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        address: formData.address || null,
        description: formData.description,
        status: 'new',
      })

    if (error) {
      console.error('Error:', error)
      setError('Failed to submit request. Please try again.')
      setLoading(false)
    } else {
      setSubmitted(true)
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Request Submitted!</h1>
          <p className="text-slate-400 mb-6">
            Thank you for your request. The contractor will review it and send you a quote soon.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setFormData({
                client_name: '',
                client_email: '',
                client_phone: '',
                address: '',
                description: '',
              })
            }}
            className="btn-secondary"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Request a Quote</h1>
          <p className="text-slate-400">
            Fill out the form below to request a quote for your project.
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Contact Info */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="client_name" className="label">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="client_name"
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="input"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="client_email" className="label">Email</label>
                  <input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="input"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="client_phone" className="label">Phone</label>
                  <input
                    id="client_phone"
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    className="input"
                    placeholder="+48 123 456 789"
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Project Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="label">Project Address</label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    placeholder="123 Main St, City"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="label">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[150px] resize-y"
                    placeholder="Describe your project in detail. What work needs to be done? What's the size of the area? Any specific requirements?"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Powered by QuoteSnap
        </p>
      </div>
    </div>
  )
}
