'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useOnboardingDismiss, useOnboardingToggle } from './useOnboardingDismiss'

export interface ChecklistData {
  userId: string
  hasServices: boolean
  hasProfile: boolean
  hasRequests: boolean
  hasQuotes: boolean
  hasSentQuotes: boolean
}

const steps = [
  {
    id: 'services',
    label: 'Set up your services',
    hint: 'Add your price list',
    href: '/services',
    field: 'hasServices' as const,
  },
  {
    id: 'profile',
    label: 'Complete your profile',
    hint: 'Company name & phone',
    href: '/settings',
    field: 'hasProfile' as const,
  },
  {
    id: 'share',
    label: 'Share link with a client',
    hint: 'So they can request a quote',
    href: '/requests',
    field: 'hasRequests' as const,
  },
  {
    id: 'quote',
    label: 'Create your first quote',
    hint: 'AI helps with line items',
    href: '/quotes',
    field: 'hasQuotes' as const,
  },
  {
    id: 'send',
    label: 'Send a quote to a client',
    hint: 'By email with one click',
    href: '/quotes',
    field: 'hasSentQuotes' as const,
  },
]

export function GettingStartedChecklist(props: ChecklistData) {
  const [dismissed, dismiss] = useOnboardingDismiss(`bq_checklist_dismissed_${props.userId}`)
  const [collapsed, toggle] = useOnboardingToggle(`bq_checklist_collapsed_${props.userId}`)

  const completedCount = steps.filter(s => props[s.field]).length
  const allDone = completedCount === steps.length

  if (dismissed) return null

  return (
    <div className="bg-[#132039] border border-[#1e3a5f] rounded-lg overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={toggle}
        className="w-full px-3 py-3 flex items-center gap-3 hover:bg-[#1e3a5f]/30 transition text-left"
      >
        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
          {allDone ? (
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {allDone ? 'All done!' : 'Getting Started'}
          </p>
          <p className="text-xs text-slate-500">{completedCount}/{steps.length} completed</p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-[#1e3a5f] mx-3">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps list */}
      {!collapsed && (
        <div className="px-3 py-2">
          <ul className="space-y-0.5">
            {steps.map((step) => {
              const completed = props[step.field]
              return (
                <li key={step.id}>
                  <Link
                    href={step.href}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md transition text-sm ${
                      completed
                        ? 'text-slate-500'
                        : 'text-slate-300 hover:bg-[#1e3a5f]/50'
                    }`}
                  >
                    {completed ? (
                      <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-600 shrink-0" />
                    )}
                    <span className={completed ? 'line-through' : ''}>
                      {step.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="w-full mt-2 text-xs text-slate-600 hover:text-slate-400 transition py-1"
          >
            {allDone ? 'Hide checklist' : 'Dismiss'}
          </button>
        </div>
      )}
    </div>
  )
}
