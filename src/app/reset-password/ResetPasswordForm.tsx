'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [checkDone, setCheckDone] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      // 1. Check URL hash for recovery tokens (implicit flow)
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (accessToken && refreshToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (mounted) {
            if (!error) {
              // Clear hash from URL
              window.history.replaceState(null, '', window.location.pathname)
              setReady(true)
            } else {
              setError('Reset link expired or invalid.')
            }
            setCheckDone(true)
          }
          return
        }
      }

      // 2. Check URL query for PKCE code
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (mounted) {
          if (!error) {
            window.history.replaceState(null, '', window.location.pathname)
            setReady(true)
          } else {
            setError('Reset link expired or invalid.')
          }
          setCheckDone(true)
        }
        return
      }

      // 3. Fallback: check existing session
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) {
        if (session) setReady(true)
        setCheckDone(true)
      }
    }

    init()

    return () => { mounted = false }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Password updated</h2>
        <p className="text-slate-400 mb-6">
          Your password has been successfully changed.
        </p>
        <Link href="/login" className="btn-primary inline-block px-8">
          Sign in
        </Link>
      </div>
    )
  }

  if (checkDone && !ready) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Link expired</h2>
        <p className="text-slate-400 mb-6">
          This reset link is expired or invalid. Please request a new one.
        </p>
        <Link href="/login" className="btn-primary inline-block px-8">
          Back to login
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Verifying reset link...</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-2 text-center">
        Set new password
      </h1>
      <p className="text-slate-400 text-sm text-center mb-6">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="label">New password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </>
  )
}
