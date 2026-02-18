'use client'

import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#132039] flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="9" height="5" rx="0.5" />
                <rect x="13" y="6" width="9" height="5" rx="0.5" />
                <rect x="6" y="13" width="9" height="5" rx="0.5" />
                <rect x="17" y="13" width="5" height="5" rx="0.5" />
                <rect x="2" y="13" width="2" height="5" rx="0.5" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">BrickQuote</span>
          </Link>
        </div>

        {/* Coming Soon Card */}
        <div className="card text-center py-8">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            Launching March 1st
          </h1>

          <p className="text-slate-400 mb-6 leading-relaxed">
            We&apos;re putting the finishing touches on BrickQuote.<br />
            Registration opens <span className="text-orange-400 font-semibold">March 1, 2026</span>.
          </p>

          <div className="bg-[#0a1628] rounded-xl p-4 mb-6">
            <p className="text-slate-500 text-sm mb-2">What you&apos;ll get:</p>
            <ul className="text-slate-300 text-sm space-y-2 text-left">
              <li className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                AI-powered professional quotes in minutes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                Photo-to-quote — snap a photo, get a quote
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                3-day free trial, no credit card required
              </li>
            </ul>
          </div>

          <Link
            href="/"
            className="btn-primary inline-block px-8"
          >
            Learn more
          </Link>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          <Link href="/privacy" className="hover:text-slate-400">Privacy Policy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-slate-400">Terms of Service</Link>
        </p>
      </div>
    </div>
  )
}
