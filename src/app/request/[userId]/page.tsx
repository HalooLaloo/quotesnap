'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

const WORK_TYPES = [
  'Bathroom renovation',
  'Kitchen renovation',
  'Full apartment renovation',
  'Painting & decorating',
  'Flooring',
  'Electrical work',
  'Plumbing',
  'Tiling',
  'Plastering',
  'Other',
]

const BUDGET_RANGES = [
  'Up to 5,000 PLN',
  '5,000 - 15,000 PLN',
  '15,000 - 30,000 PLN',
  '30,000 - 50,000 PLN',
  '50,000 - 100,000 PLN',
  'Over 100,000 PLN',
  'Not sure yet',
]

const TIMELINE_OPTIONS = [
  'As soon as possible',
  'Within 1 month',
  'Within 3 months',
  'Within 6 months',
  'Flexible / Not urgent',
]

export default function ClientRequestPage() {
  const params = useParams()
  const contractorId = params.userId as string
  const supabase = createClient()

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    address: '',
    work_type: '',
    budget_range: '',
    timeline: '',
    property_size: '',
    description: '',
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Limit do 5 zdjęć
    const newPhotos = [...photos, ...files].slice(0, 5)
    setPhotos(newPhotos)

    // Generuj podglądy
    const previews = newPhotos.map(file => URL.createObjectURL(file))
    setPhotosPreviews(previews)
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const newPreviews = photosPreviews.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    setPhotosPreviews(newPreviews)
  }

  const uploadPhotos = async (): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${contractorId}/${Date.now()}-${i}.${fileExt}`

      const { error } = await supabase.storage
        .from('quote-photos')
        .upload(fileName, file)

      if (error) {
        console.error('Upload error:', error)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('quote-photos')
        .getPublicUrl(fileName)

      uploadedUrls.push(urlData.publicUrl)
      setUploadProgress(Math.round(((i + 1) / photos.length) * 100))
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setUploadProgress(0)

    try {
      // Upload zdjęć
      let photoUrls: string[] = []
      if (photos.length > 0) {
        photoUrls = await uploadPhotos()
      }

      // Złóż opis z dodatkowymi informacjami
      const fullDescription = `
WORK TYPE: ${formData.work_type || 'Not specified'}
BUDGET: ${formData.budget_range || 'Not specified'}
TIMELINE: ${formData.timeline || 'Not specified'}
PROPERTY SIZE: ${formData.property_size || 'Not specified'}

DESCRIPTION:
${formData.description}
      `.trim()

      const { error } = await supabase
        .from('qs_quote_requests')
        .insert({
          contractor_id: contractorId,
          client_name: formData.client_name,
          client_email: formData.client_email || null,
          client_phone: formData.client_phone || null,
          address: formData.address || null,
          description: fullDescription,
          photos: photoUrls,
          status: 'new',
        })

      if (error) {
        console.error('Error:', error)
        setError('Failed to submit request. Please try again.')
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to submit request. Please try again.')
    }

    setLoading(false)
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
                work_type: '',
                budget_range: '',
                timeline: '',
                property_size: '',
                description: '',
              })
              setPhotos([])
              setPhotosPreviews([])
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
            Fill out the form below and we&apos;ll get back to you with a detailed quote.
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Contact Info */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm">1</span>
                Contact Information
              </h2>
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
                <div className="md:col-span-2">
                  <label htmlFor="address" className="label">Project Address</label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    placeholder="Street, City, Postal Code"
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm">2</span>
                Project Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="work_type" className="label">
                    Type of Work <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="work_type"
                    value={formData.work_type}
                    onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select type of work...</option>
                    {WORK_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="budget_range" className="label">Estimated Budget</label>
                    <select
                      id="budget_range"
                      value={formData.budget_range}
                      onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                      className="input"
                    >
                      <option value="">Select budget range...</option>
                      {BUDGET_RANGES.map((range) => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="timeline" className="label">Preferred Timeline</label>
                    <select
                      id="timeline"
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="input"
                    >
                      <option value="">Select timeline...</option>
                      {TIMELINE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="property_size" className="label">Property Size (m²)</label>
                  <input
                    id="property_size"
                    type="text"
                    value={formData.property_size}
                    onChange={(e) => setFormData({ ...formData, property_size: e.target.value })}
                    className="input"
                    placeholder="e.g., 50 m² or 25 m² bathroom"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="label">
                    Project Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[120px] resize-y"
                    placeholder="Please describe your project in detail. What needs to be done? Any specific requirements or preferences?"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm">3</span>
                Photos (Optional)
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Upload up to 5 photos of the space or area that needs work. This helps us provide a more accurate quote.
              </p>

              {/* Photo previews */}
              {photosPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                  {photosPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {photos.length < 5 && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-slate-500 hover:bg-slate-800/50 transition-colors">
                  <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-400 text-sm">Click to upload photos</span>
                  <span className="text-slate-500 text-xs mt-1">{photos.length}/5 photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit */}
            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Uploading photos...</span>
                  <span className="text-white">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

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
