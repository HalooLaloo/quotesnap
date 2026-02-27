'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LogoutButton } from './LogoutButton'
import { GettingStartedChecklist, ChecklistData } from './onboarding/GettingStartedChecklist'

interface SidebarProps {
  userEmail: string
  checklistData?: ChecklistData
}

const navItems = [
  {
    href: '/requests',
    label: 'Requests',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
  {
    href: '/quotes',
    label: 'Quotes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/invoices',
    label: 'Invoices',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: '/services',
    label: 'My Services',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export function Sidebar({ userEmail, checklistData }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/requests') {
      return pathname === '/requests' || pathname.startsWith('/requests/')
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button - brick logo */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed left-3 z-40 p-2 bg-[#132039] border border-[#1e3a5f] rounded-xl text-orange-500 hover:bg-[#1e3a5f] shadow-lg"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 36px)' }}
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="9.5" height="5" rx="0.7" />
                <rect x="12.5" y="6" width="9.5" height="5" rx="0.7" />
                <rect x="2" y="12.5" width="3.5" height="5" rx="0.7" />
                <rect x="6.5" y="12.5" width="9.5" height="5" rx="0.7" />
                <rect x="17" y="12.5" width="5" height="5" rx="0.7" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-[#0a1628] border-r border-[#1e3a5f] flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Spacer for mobile status bar */}
        <div className="lg:hidden h-8 shrink-0" />
        {/* Logo */}
        <div className="p-4 border-b border-[#1e3a5f] flex items-center justify-between">
          <Link href="/requests" className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-[#132039] flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="9.5" height="5" rx="0.7" />
                <rect x="12.5" y="6" width="9.5" height="5" rx="0.7" />
                <rect x="2" y="12.5" width="3.5" height="5" rx="0.7" />
                <rect x="6.5" y="12.5" width="9.5" height="5" rx="0.7" />
                <rect x="17" y="12.5" width="5" height="5" rx="0.7" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">BrickQuote</span>
          </Link>
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-[#132039]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Getting Started checklist */}
        {checklistData && (
          <div className="px-4 pb-2 border-t border-[#1e3a5f] pt-3">
            <GettingStartedChecklist {...checklistData} />
          </div>
        )}

        {/* User section */}
        <div className="p-4 border-t border-[#1e3a5f]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-sm text-slate-300">
                {userEmail?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{userEmail}</p>
            </div>
          </div>
          <a
            href="mailto:support@brickquote.app?subject=BrickQuote Feedback"
            className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-[#132039] rounded-lg transition-colors text-sm mb-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Feedback
          </a>
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}
