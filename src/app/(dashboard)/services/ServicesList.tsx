'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Service, UNITS } from '@/lib/types'

interface ServicesListProps {
  services: Service[]
  currencySymbol: string
}

export function ServicesList({ services, currencySymbol }: ServicesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [loading, setLoading] = useState(false)

  // Add form state
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState<string>('m2')
  const [newPrice, setNewPrice] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const cs = currencySymbol

  // Add service
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setAddError('Not authenticated')
      setAddLoading(false)
      return
    }

    const { error } = await supabase
      .from('qs_services')
      .insert({
        user_id: user.id,
        name: newName,
        unit: newUnit,
        price: parseFloat(newPrice),
      })

    if (error) {
      setAddError(error.message)
    } else {
      setNewName('')
      setNewPrice('')
      setNewUnit('m2')
      setShowAdd(false)
      router.refresh()
    }
    setAddLoading(false)
  }

  // Edit service
  const startEdit = (service: Service) => {
    setEditingId(service.id)
    setEditName(service.name)
    setEditUnit(service.unit)
    setEditPrice(service.price.toString())
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('qs_services')
      .update({
        name: editName,
        unit: editUnit,
        price: parseFloat(editPrice),
      })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      router.refresh()
    }
    setLoading(false)
  }

  // Delete service
  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return
    setLoading(true)
    const { error } = await supabase
      .from('qs_services')
      .delete()
      .eq('id', id)

    if (!error) {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Add Service Button / Form */}
      {showAdd ? (
        <form onSubmit={handleAdd} className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Add Service</h2>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setAddError('') }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {addError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
              {addError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Service Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input"
                placeholder="e.g. Tile Installation"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Unit</label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="input"
                >
                  {Object.entries(UNITS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Price ({cs})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="input"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="btn-primary w-full"
            >
              {addLoading ? 'Adding...' : 'Add Service'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-xl text-slate-400 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Service
        </button>
      )}

      {/* Services Grid */}
      {services.length > 0 ? (
        <div>
          <p className="text-slate-500 text-sm mb-3">{services.length} service{services.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="card p-4"
              >
                {editingId === service.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        className="input text-sm"
                      >
                        {Object.entries(UNITS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="input text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(service.id)}
                        disabled={loading}
                        className="btn-primary flex-1 text-sm py-1.5"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="btn-secondary flex-1 text-sm py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-medium leading-snug">{service.name}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(service)}
                          className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteService(service.id)}
                          disabled={loading}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-blue-400 font-semibold text-lg mt-2">
                      {cs}{service.price.toFixed(2)}
                      <span className="text-slate-500 text-sm font-normal"> / {UNITS[service.unit as keyof typeof UNITS]}</span>
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">No services yet</h3>
          <p className="text-slate-400 text-sm mb-6">Add your first service to start creating quotes.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Service
          </button>
        </div>
      )}
    </div>
  )
}
