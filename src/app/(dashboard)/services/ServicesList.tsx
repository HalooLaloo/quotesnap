'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Service, UNITS } from '@/lib/types'

interface ServicesListProps {
  services: Service[]
}

export function ServicesList({ services }: ServicesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const startEdit = (service: Service) => {
    setEditingId(service.id)
    setEditName(service.name)
    setEditUnit(service.unit)
    setEditPrice(service.price.toString())
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditUnit('')
    setEditPrice('')
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

  const deleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

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

  if (services.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-lg font-medium text-white mb-2">No services yet</h3>
        <p className="text-slate-400">Add your first service to start creating quotes.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-white mb-6">
        Your Services ({services.length})
      </h2>

      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
          >
            {editingId === service.id ? (
              // Edit mode
              <div className="flex-1 flex items-center gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input flex-1"
                />
                <select
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="input w-24"
                >
                  {Object.entries(UNITS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="input w-28"
                />
                <button
                  onClick={() => saveEdit(service.id)}
                  disabled={loading}
                  className="btn-primary"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            ) : (
              // View mode
              <>
                <div>
                  <p className="text-white font-medium">{service.name}</p>
                  <p className="text-slate-400 text-sm">
                    {service.price.toFixed(2)} / {UNITS[service.unit as keyof typeof UNITS]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(service)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
