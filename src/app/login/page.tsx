'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [copied, setCopied] = useState(false)
  const isNativeApp = useMemo(() => typeof navigator !== 'undefined' && navigator.userAgent.includes('BrickQuoteApp'), [])

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess('Email verified! Please log in with your password.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/requests'
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email) {
      setError('Please enter your email address')
      return
    }

    setResetLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password reset link sent! Check your inbox.')
    }
    setResetLoading(false)
  }

  if (resetMode) {
    return (
      <div className="card">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Reset password
        </h1>
        <p className="text-slate-400 text-sm text-center mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="reset-email" className="label">E-mail</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={resetLoading}
            className="btn-primary w-full"
          >
            {resetLoading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          <button
            onClick={() => { setResetMode(false); setError(''); setSuccess('') }}
            className="text-blue-400 hover:text-blue-300"
          >
            Back to login
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">
        Welcome back
      </h1>

      <form onSubmit={handleLogin} className="space-y-4">
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="label">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
          />
          <div className="text-right mt-1">
            <button
              type="button"
              onClick={() => { setResetMode(true); setError(''); setSuccess('') }}
              className="text-slate-500 hover:text-blue-400 text-xs transition"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {isNativeApp ? (
        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>Don&apos;t have an account?</p>
          <p className="mt-1">Open your browser and go to:</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://brickquote.app/register')
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="mt-2 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-blue-400 font-medium px-4 py-2 rounded-lg transition"
          >
            brickquote.app/register
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {copied ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
          </button>
          {copied && <p className="text-green-400 text-xs mt-1">Copied!</p>}
        </div>
      ) : (
        <p className="mt-6 text-center text-slate-400 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300">
            Sign up
          </Link>
        </p>
      )}
    </div>
  )
}

export default function LoginPage() {
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

        <Suspense fallback={<div className="card"><div className="text-center text-slate-400">Loading...</div></div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-slate-500 text-xs mt-6">
          <Link href="/privacy" className="hover:text-slate-400">Privacy Policy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-slate-400">Terms of Service</Link>
        </p>
      </div>
    </div>
  )
}
