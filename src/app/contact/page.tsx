'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })

      if (res.status === 429) {
        setError('Too many requests. Please try again later.')
        setLoading(false)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send message')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Navigation */}
      <nav className="border-b border-[#1e3a5f] bg-[#0a1628]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
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
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-4">Contact Us</h1>
            <p className="text-slate-400">
              Have questions or need help? Send us a message and we&apos;ll get back to you within 24 hours.
            </p>
          </div>

          {success ? (
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Message sent!</h2>
              <p className="text-slate-400 mb-6">
                Thanks for reaching out. We&apos;ll reply to <span className="text-white font-medium">{email}</span> as soon as possible.
              </p>
              <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium">
                ← Back to homepage
              </Link>
            </div>
          ) : (
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    placeholder="John Smith"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input min-h-[140px]"
                    placeholder="How can we help?"
                    required
                    maxLength={5000}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </div>
          )}

          {/* Extra info */}
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-medium text-sm mb-1">Response Time</h3>
              <p className="text-slate-500 text-xs">We reply within 24 hours on business days</p>
            </div>

            <div className="bg-[#132039] border border-[#1e3a5f] rounded-xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-medium text-sm mb-1">FAQ</h3>
              <p className="text-slate-500 text-xs">
                <Link href="/#faq" className="text-purple-400 hover:text-purple-300">
                  Check common questions →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[#1e3a5f]">
        <div className="max-w-4xl mx-auto text-center text-slate-500 text-sm">
          © 2026 BrickQuote. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
