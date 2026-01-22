'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'

const statuses = [
  { value: '', label: 'Active' },
  { value: 'new', label: 'New' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
]

export function RequestFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const currentStatus = searchParams.get('status') || ''

  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value)
        } else {
          newParams.delete(key)
        }
      })
      return newParams.toString()
    },
    [searchParams]
  )

  const handleStatusChange = (status: string) => {
    const query = createQueryString({ status })
    router.push(`/requests${query ? `?${query}` : ''}`)
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get('search') || '')) {
        const query = createQueryString({ search })
        router.push(`/requests${query ? `?${query}` : ''}`)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, searchParams, createQueryString, router])

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="flex-1">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              currentStatus === status.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  )
}
