'use client'

import { useState } from 'react'

type Tab = 'contractor' | 'client'

export function HeroMockup() {
  const [activeTab, setActiveTab] = useState<Tab>('contractor')

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Glow effects */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Tab switcher */}
      <div className="relative flex justify-center mb-4">
        <div className="inline-flex bg-[#132039] border border-[#1e3a5f] rounded-xl p-1">
          <button
            onClick={() => setActiveTab('contractor')}
            className={`px-3 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'contractor'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Your Dashboard
            </span>
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`px-3 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'client'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              What Your Client Sees
            </span>
          </button>
        </div>
      </div>

      {/* Browser mockup */}
      <div className="relative rounded-xl overflow-hidden border border-[#1e3a5f] bg-[#0d1f35] shadow-2xl">
        {/* Browser header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#132039] border-b border-[#1e3a5f]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1.5 rounded-md bg-[#0d1f35] text-slate-400 text-xs flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
              {activeTab === 'contractor' ? 'app.brickquote.app/requests' : 'brickquote.app/request/your-link'}
            </div>
          </div>
        </div>

        {/* Content area */}
        {activeTab === 'contractor' ? <ContractorView /> : <ClientView />}
      </div>

      {/* Floating badges */}
      {activeTab === 'contractor' && (
        <>
          <div className="absolute -left-4 top-1/3 transform -translate-x-full hidden lg:block animate-pulse">
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-lg p-3 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Quote accepted!</p>
                  <p className="text-sm font-medium text-white">+$8,500</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 top-1/3 transform translate-x-full hidden lg:block animate-pulse" style={{ animationDelay: '1s' }}>
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-lg p-3 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400">AI generated</p>
                  <p className="text-sm font-medium text-white">12 line items</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'client' && (
        <>
          <div className="absolute -left-4 top-1/3 transform -translate-x-full hidden lg:block animate-pulse">
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-lg p-3 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Photo uploaded</p>
                  <p className="text-sm font-medium text-white">AI analyzing...</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 top-1/4 transform translate-x-full hidden lg:block animate-pulse" style={{ animationDelay: '0.5s' }}>
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-lg p-3 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400">No app needed</p>
                  <p className="text-sm font-medium text-white">Works on any device</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ContractorView() {
  return (
    <div className="bg-[#0a1628]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e3a5f]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#132039] flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="6" width="9" height="5" rx="0.5" />
              <rect x="13" y="6" width="9" height="5" rx="0.5" />
              <rect x="6" y="13" width="9" height="5" rx="0.5" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white">BrickQuote</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">2</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-xs text-white font-bold">JD</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-40 border-r border-[#1e3a5f] py-3 px-2 hidden sm:block">
          <nav className="space-y-0.5">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              Requests
              <span className="ml-auto bg-blue-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">3</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-white rounded-lg text-xs font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Quotes
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-white rounded-lg text-xs font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Invoices
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-white rounded-lg text-xs font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Services
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-white rounded-lg text-xs font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-5">
          {/* Page header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Incoming Requests</h3>
              <p className="text-slate-500 text-xs">AI collects project details from your clients</p>
            </div>
          </div>

          {/* Request with AI suggestion */}
          <div className="p-4 bg-[#132039] rounded-lg border border-blue-500/50 mb-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Bathroom Remodel — John Smith</p>
                    <div className="flex items-center gap-2 mt-1">
                      <img src="/demo-bathroom-1.webp" alt="Client photo" className="w-8 h-8 rounded object-cover" />
                      <img src="/demo-bathroom-2.webp" alt="Client photo" className="w-8 h-8 rounded object-cover" />
                      <span className="text-slate-500 text-xs">2 photos • AI summary ready</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">New</span>
              </div>

              {/* AI-generated quote preview */}
              <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded font-medium">AI Suggested Quote</div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Old tile removal</span>
                    <span>65 sqft &times; $8 = <span className="text-white font-medium">$520</span></span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Waterproofing</span>
                    <span>65 sqft &times; $10 = <span className="text-white font-medium">$650</span></span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Floor tile installation</span>
                    <span>65 sqft &times; $22 = <span className="text-white font-medium">$1,430</span></span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Wall tile installation</span>
                    <span>180 sqft &times; $25 = <span className="text-white font-medium">$4,500</span></span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>+ 4 more items...</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#1e3a5f]">
                    <span className="text-white font-semibold">Total estimate</span>
                    <span className="text-green-400 font-bold text-sm">$8,740</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <div className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg">Review & Send Quote</div>
                <div className="px-4 py-2 bg-[#1e3a5f] text-slate-300 text-xs font-medium rounded-lg">Edit Items</div>
              </div>
            </div>
          </div>

          {/* Pipeline cards */}
          <div className="space-y-2">
            <div className="p-3 bg-[#132039] rounded-lg border border-[#1e3a5f] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Interior Painting — Sarah J.</p>
                  <p className="text-slate-500 text-xs">Quote accepted</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-semibold">$4,200</span>
                <div className="px-3 py-1.5 bg-cyan-600 text-white text-[10px] font-medium rounded-lg">Convert to Invoice</div>
              </div>
            </div>

            <div className="p-3 bg-[#132039] rounded-lg border border-[#1e3a5f] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Kitchen Tiles — Mike D.</p>
                  <p className="text-slate-500 text-xs">Invoice sent • Awaiting payment</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-semibold">$3,850</span>
                <span className="text-amber-400 text-xs font-medium">Unpaid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClientView() {
  return (
    <div className="p-6 bg-[#0a1628]">
      {/* Chat header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#1e3a5f]">
        <div className="w-10 h-10 bg-[#132039] rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="6" width="9" height="5" rx="0.5" />
            <rect x="13" y="6" width="9" height="5" rx="0.5" />
            <rect x="6" y="13" width="9" height="5" rx="0.5" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">BrickQuote</h3>
          <p className="text-slate-500 text-xs">Quote Assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-green-400 text-xs">Online</span>
        </div>
      </div>

      {/* Chat messages */}
      <div className="space-y-3 mb-4">
        {/* AI */}
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="bg-[#1e3a5f] rounded-2xl rounded-tl-md p-3 max-w-[80%]">
            <p className="text-white text-sm">Hi! I&apos;m here to help you get a quote. What kind of work do you need done?</p>
          </div>
        </div>

        {/* User */}
        <div className="flex justify-end">
          <div className="bg-blue-600 rounded-2xl rounded-tr-md p-3 max-w-[80%]">
            <p className="text-white text-sm">I need to remodel my bathroom. New tiles, new fixtures, everything.</p>
          </div>
        </div>

        {/* AI */}
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="bg-[#1e3a5f] rounded-2xl rounded-tl-md p-3 max-w-[80%]">
            <p className="text-white text-sm">Great! What&apos;s the approximate size of the bathroom in square feet?</p>
          </div>
        </div>

        {/* User with photo */}
        <div className="flex justify-end">
          <div className="bg-blue-600 rounded-2xl rounded-tr-md p-3 max-w-[80%]">
            <div className="flex gap-2 mb-2">
              <img src="/demo-bathroom-1.webp" alt="Bathroom renovation" className="w-16 h-16 rounded-lg object-cover" />
              <img src="/demo-bathroom-2.webp" alt="Bathroom renovation" className="w-16 h-16 rounded-lg object-cover" />
            </div>
            <p className="text-white text-sm">About 65 sqft. Here are some photos</p>
          </div>
        </div>

        {/* AI analyzing */}
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="bg-[#1e3a5f] rounded-2xl rounded-tl-md p-3 max-w-[80%]">
            <p className="text-white text-sm">I can see the bathroom has old ceramic tiles on the walls and floor. The grout looks worn and there&apos;s some moisture damage near the shower. Are the current fixtures (faucets, toilet, shower) being replaced too?</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-[#1e3a5f] rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
        </div>
        <span className="text-slate-500 text-xs">Question 3 of ~7</span>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-[#1e3a5f] rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 bg-[#1e3a5f] rounded-full px-4 py-2.5">
          <p className="text-slate-500 text-sm">Type a message...</p>
        </div>
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      </div>
    </div>
  )
}
