'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UNITS } from '@/lib/types'

export function AddServiceForm() {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState<string>('m2')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('qs_services')
      .insert({
        user_id: user.id,
        name,
        unit,
        price: parseFloat(price),
      })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setName('')
      setPrice('')
      setUnit('m2')
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-white mb-6">Add New Service</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="label">Service Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="e.g., Tile Installation"
            required
          />
        </div>

        <div>
          <label htmlFor="unit" className="label">Unit</label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="input"
          >
            {Object.entries(UNITS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="price" className="label">Price (PLN)</label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
            placeholder="0.00"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Adding...' : 'Add Service'}
        </button>
      </form>
    </div>
  )
}
