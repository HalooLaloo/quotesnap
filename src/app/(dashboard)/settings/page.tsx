'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { COUNTRIES, COUNTRY_LIST, DEFAULT_COUNTRY } from '@/lib/countries'

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  AU: '🇦🇺',
  CA: '🇨🇦',
  IE: '🇮🇪',
  NZ: '🇳🇿',
}

interface ProfileFields {
  fullName: string
  companyName: string
  phone: string
  country: string
  taxId: string
  businessAddress: string
  bankName: string
  bankAccount: string
  bankRouting: string
  companyRegNumber: string
}

const COMPLETENESS_FIELDS = [
  { key: 'fullName' as const, label: 'Full Name' },
  { key: 'companyName' as const, label: 'Company Name' },
  { key: 'phone' as const, label: 'Phone' },
  { key: 'businessAddress' as const, label: 'Business Address' },
  { key: 'bankName' as const, label: 'Bank Name' },
  { key: 'bankAccount' as const, label: 'Account Number' },
  { key: 'taxId' as const, label: 'Tax ID' },
]

export default function SettingsPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [signOutDebug, setSignOutDebug] = useState<string[]>([])
  const [success, setSuccess] = useState('')

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Change password
  const [passwordResetSent, setPasswordResetSent] = useState(false)
  const [passwordResetLoading, setPasswordResetLoading] = useState(false)

  // Subscription
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [stripePriceId, setStripePriceId] = useState<string | null>(null)
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)
  const [managingSubscription, setManagingSubscription] = useState(false)

  // Profile fields
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [taxId, setTaxId] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankRouting, setBankRouting] = useState('')
  const [companyRegNumber, setCompanyRegNumber] = useState('')

  // Dirty state tracking
  const initialValues = useRef<ProfileFields | null>(null)

  const currentValues: ProfileFields = {
    fullName, companyName, phone, country, taxId,
    businessAddress, bankName, bankAccount, bankRouting, companyRegNumber,
  }

  const isDirty = initialValues.current !== null && (
    initialValues.current.fullName !== fullName ||
    initialValues.current.companyName !== companyName ||
    initialValues.current.phone !== phone ||
    initialValues.current.country !== country ||
    initialValues.current.taxId !== taxId ||
    initialValues.current.businessAddress !== businessAddress ||
    initialValues.current.bankName !== bankName ||
    initialValues.current.bankAccount !== bankAccount ||
    initialValues.current.bankRouting !== bankRouting ||
    initialValues.current.companyRegNumber !== companyRegNumber
  )

  // Profile completeness
  const filledCount = COMPLETENESS_FIELDS.filter(f => currentValues[f.key].trim() !== '').length
  const missingFields = COMPLETENESS_FIELDS.filter(f => currentValues[f.key].trim() === '')
  const completenessPercent = Math.round((filledCount / COMPLETENESS_FIELDS.length) * 100)
  const isComplete = filledCount === COMPLETENESS_FIELDS.length

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        if (profile) {
          const vals: ProfileFields = {
            fullName: profile.full_name || '',
            companyName: profile.company_name || '',
            phone: profile.phone || '',
            country: profile.country || DEFAULT_COUNTRY,
            taxId: profile.tax_id || '',
            businessAddress: profile.business_address || '',
            bankName: profile.bank_name || '',
            bankAccount: profile.bank_account || '',
            bankRouting: profile.bank_routing || '',
            companyRegNumber: profile.company_reg_number || '',
          }

          setFullName(vals.fullName)
          setCompanyName(vals.companyName)
          setEmail(user.email || '')
          setPhone(vals.phone)
          setCountry(vals.country)
          setTaxId(vals.taxId)
          setBusinessAddress(vals.businessAddress)
          setBankName(vals.bankName)
          setBankAccount(vals.bankAccount)
          setBankRouting(vals.bankRouting)
          setCompanyRegNumber(vals.companyRegNumber)
          setSubscriptionStatus(profile.subscription_status)
          setStripePriceId(profile.stripe_price_id)
          setPeriodEnd(profile.subscription_current_period_end)

          initialValues.current = vals
        }
      } catch {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const countryConfig = COUNTRIES[country] || COUNTRIES[DEFAULT_COUNTRY]

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          phone,
          country,
          currency: countryConfig.currency,
          tax_id: taxId,
          business_address: businessAddress,
          bank_name: bankName,
          bank_account: bankAccount,
          bank_routing: bankRouting || null,
          company_reg_number: companyRegNumber || null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update initial values to current
      initialValues.current = { ...currentValues }
      setSuccess('Settings saved successfully')
      router.refresh()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete account')
      }
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleting(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setPasswordResetSent(true)
    } catch {
      setError('Failed to send password reset email')
    } finally {
      setPasswordResetLoading(false)
    }
  }


  const handleManageSubscription = async () => {
    setManagingSubscription(true)
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to open subscription management')
        setManagingSubscription(false)
      }
    } catch {
      setError('Failed to open subscription management')
      setManagingSubscription(false)
    }
  }

  const getPlanName = () => {
    if (!stripePriceId) return 'No plan'
    if (stripePriceId === process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID) return 'Pro Monthly'
    if (stripePriceId === process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID) return 'Pro Yearly'
    return 'Pro'
  }

  const getStatusBadge = () => {
    switch (subscriptionStatus) {
      case 'active':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Active</span>
      case 'trialing':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">Trial</span>
      case 'past_due':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">Past Due</span>
      case 'canceled':
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium">Canceled</span>
      default:
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium">Inactive</span>
    }
  }

  const selectedCountry = COUNTRIES[country] || COUNTRIES[DEFAULT_COUNTRY]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-28">
      {/* DEBUG: Sign out test - remove after fixing */}
      <div className="mb-4 p-4 border-2 border-yellow-500 rounded-lg bg-yellow-500/10 space-y-3">
        <p className="text-yellow-400 font-bold text-sm">DEBUG: Sign Out Tests</p>
        <div className="flex flex-wrap gap-2">
          <a href="/api/auth/signout" style={{padding:'10px 20px',background:'red',color:'white',borderRadius:'8px',display:'inline-block',textDecoration:'none',fontWeight:'bold'}}>
            Test 1: Link
          </a>
          <button onClick={() => { window.location.href = '/api/auth/signout' }} style={{padding:'10px 20px',background:'blue',color:'white',borderRadius:'8px',fontWeight:'bold',border:'none'}}>
            Test 2: JS redirect
          </button>
          <button onClick={() => { setSignOutDebug(['Click works! JS is running.']) }} style={{padding:'10px 20px',background:'green',color:'white',borderRadius:'8px',fontWeight:'bold',border:'none'}}>
            Test 3: JS only
          </button>
        </div>
        {signOutDebug.length > 0 && (
          <div className="p-2 bg-black rounded text-xs font-mono text-green-400">{signOutDebug.join('\n')}</div>
        )}
      </div>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your profile and business details</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm mb-6">
          {success}
        </div>
      )}

      {/* Profile Completeness */}
      {!isComplete && (
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              completenessPercent >= 70 ? 'bg-blue-600/20' : 'bg-amber-600/20'
            }`}>
              <svg className={`w-5 h-5 ${completenessPercent >= 70 ? 'text-blue-400' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">Profile Completion</span>
                <span className={`text-sm font-medium ${completenessPercent >= 70 ? 'text-blue-400' : 'text-amber-400'}`}>
                  {filledCount}/{COMPLETENESS_FIELDS.length}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completenessPercent >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-xs">
            Complete your profile for professional quotes and invoices.
            {missingFields.length > 0 && (
              <> Missing: <span className="text-slate-300">{missingFields.map(f => f.label).join(', ')}</span></>
            )}
          </p>
        </div>
      )}

      {/* Personal Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="input bg-slate-700 cursor-not-allowed"
            />
            <p className="text-slate-500 text-xs mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="+1 234 567 890"
            />
          </div>
        </div>
      </div>

      {/* Country & Currency */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Location & Currency</h2>
        <div>
          <label className="label">Country</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {COUNTRY_LIST.map((c) => (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  country === c.code
                    ? 'border-blue-500 bg-blue-600/10'
                    : 'border-[#1e3a5f] bg-[#1e3a5f]/30 hover:border-slate-500'
                }`}
              >
                <span className="text-xl">{COUNTRY_FLAGS[c.code]}</span>
                <span className={`font-medium block mt-1 ${country === c.code ? 'text-white' : 'text-slate-300'}`}>
                  {c.name}
                </span>
                <span className="text-slate-500 text-xs">
                  {COUNTRIES[c.code].currencySymbol} {COUNTRIES[c.code].currency}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 bg-[#1e3a5f]/30 rounded-lg p-4">
          <p className="text-slate-400 text-sm">
            Based on your location, your quotes and invoices will use{' '}
            <span className="text-white font-medium">{selectedCountry.currency}</span> currency and{' '}
            <span className="text-white font-medium">{selectedCountry.taxLabel}</span> for taxes.
          </p>
        </div>
      </div>

      {/* Business Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Business Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input"
              placeholder="Your Company Ltd"
            />
          </div>
          <div>
            <label className="label">{selectedCountry.taxIdLabel}</label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="input"
              placeholder={selectedCountry.taxIdPlaceholder}
            />
            {selectedCountry.taxIdRequired && (
              <p className="text-amber-400 text-xs mt-1">Required for invoices in {selectedCountry.name}</p>
            )}
          </div>
          {selectedCountry.showCompanyRegNumber && (
            <div>
              <label className="label">{selectedCountry.companyRegLabel}</label>
              <input
                type="text"
                value={companyRegNumber}
                onChange={(e) => setCompanyRegNumber(e.target.value)}
                className="input"
                placeholder={selectedCountry.companyRegPlaceholder}
              />
            </div>
          )}
          <div className="md:col-span-2">
            <label className="label">Business Address</label>
            <textarea
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              className="input min-h-[80px]"
              placeholder="123 Main Street&#10;City, State 12345"
            />
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Bank Details</h2>
        <p className="text-slate-400 text-sm mb-4">
          These details will appear on your invoices for client payments.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="input"
              placeholder="Bank of America"
            />
          </div>
          <div>
            <label className="label">{selectedCountry.bankRoutingLabel}</label>
            <input
              type="text"
              value={bankRouting}
              onChange={(e) => setBankRouting(e.target.value)}
              className="input"
              placeholder={selectedCountry.bankRoutingPlaceholder}
            />
          </div>
          <div>
            <label className="label">Account Number / IBAN</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="input"
              placeholder="XXXX XXXX XXXX XXXX"
            />
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Subscription</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#1e3a5f]/30 rounded-lg">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">{getPlanName()}</span>
                {getStatusBadge()}
              </div>
              {periodEnd && (
                <p className="text-slate-400 text-sm mt-1">
                  {subscriptionStatus === 'trialing' ? 'Trial ends' : 'Next billing'}: {new Date(periodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={managingSubscription}
              className="btn-secondary"
            >
              {managingSubscription ? 'Loading...' : 'Manage'}
            </button>
          </div>
          <p className="text-slate-500 text-sm">
            Manage your subscription, update payment method, or cancel anytime.
          </p>
        </div>
      </div>

      {/* Account Section */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#1e3a5f]/30 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-slate-600 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-slate-300 text-sm truncate">{email}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleChangePassword}
              disabled={passwordResetLoading || passwordResetSent}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {passwordResetLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : passwordResetSent ? (
                <>
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Check your email
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change Password
                </>
              )}
            </button>

            <button
              onClick={async () => {
                const logs: string[] = []
                try {
                  logs.push('1. Click detected')
                  setSignOutDebug([...logs])

                  logs.push('2. Calling signOut()...')
                  setSignOutDebug([...logs])
                  const { error: signOutError } = await supabase.auth.signOut()
                  logs.push(signOutError ? `3. signOut error: ${signOutError.message}` : '3. signOut OK')
                  setSignOutDebug([...logs])

                  logs.push('4. Clearing cookies...')
                  setSignOutDebug([...logs])
                  document.cookie.split(';').forEach(c => {
                    const name = c.split('=')[0].trim()
                    if (name.startsWith('sb-')) {
                      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
                      logs.push(`   Cleared: ${name}`)
                    }
                  })
                  setSignOutDebug([...logs])

                  logs.push('5. Fetching /api/auth/signout...')
                  setSignOutDebug([...logs])
                  const res = await fetch('/api/auth/signout', { redirect: 'manual' })
                  logs.push(`6. Response: ${res.status} ${res.type}`)
                  logs.push(`   Location: ${res.headers.get('location') || 'none'}`)
                  setSignOutDebug([...logs])

                  logs.push('7. Redirecting with window.location...')
                  setSignOutDebug([...logs])
                  window.location.href = '/login'
                } catch (err) {
                  logs.push(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
                  setSignOutDebug([...logs])
                }
              }}
              className="btn-secondary flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
            {signOutDebug.length > 0 && (
              <div className="mt-3 p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-green-400 whitespace-pre-wrap">
                {signOutDebug.join('\n')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <details className="border border-red-500/30 rounded-xl bg-red-500/5 group">
        <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden p-6">
          <div>
            <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
            <p className="text-slate-500 text-sm mt-1">Permanently delete your account and all data</p>
          </div>
          <svg className="w-5 h-5 text-red-400/50 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-6 pb-6 pt-0">
          <p className="text-slate-400 text-sm mb-4">
            This will permanently delete your account, all quotes, invoices, and client data. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-red-400 text-sm font-medium">
                Type <code className="bg-red-500/20 px-1.5 py-0.5 rounded">DELETE</code> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="input border-red-500/30 w-48"
                placeholder="Type DELETE"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Sticky Save Bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-sm border-t border-[#1e3a5f]">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <p className="text-slate-400 text-sm">You have unsaved changes</p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-8"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
