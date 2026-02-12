'use client'

import { useState, useEffect, useMemo } from 'react'
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

export default function SettingsPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // User ID for integrations
  const [userId, setUserId] = useState('')
  const [copied, setCopied] = useState(false)

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
          setUserId(user.id)
          setFullName(profile.full_name || '')
          setCompanyName(profile.company_name || '')
          setEmail(user.email || '')
          setPhone(profile.phone || '')
          setCountry(profile.country || DEFAULT_COUNTRY)
          setTaxId(profile.tax_id || '')
          setBusinessAddress(profile.business_address || '')
          setBankName(profile.bank_name || '')
          setBankAccount(profile.bank_account || '')
          setBankRouting(profile.bank_routing || '')
          setCompanyRegNumber(profile.company_reg_number || '')
          setSubscriptionStatus(profile.subscription_status)
          setStripePriceId(profile.stripe_price_id)
          setPeriodEnd(profile.subscription_current_period_end)
        }
      } catch (err) {
        console.error('Error loading profile:', err)
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

      setSuccess('Settings saved successfully')
      router.refresh()
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const selectedCountry = COUNTRIES[country] || COUNTRIES[DEFAULT_COUNTRY]

  const handleManageSubscription = async () => {
    setManagingSubscription(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to open subscription management')
        setManagingSubscription(false)
      }
    } catch (err) {
      console.error('Portal error:', err)
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your profile and business details</p>
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
      <div className="card mb-8">
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

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-8"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Subscription Section */}
      <div className="card mt-8">
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
      <div className="card mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
        <div>
          <label className="label">Your Account ID</label>
          <p className="text-slate-400 text-sm mb-2">
            Use this ID to connect with other Brick apps like BrickProfile
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-[#1e3a5f]/50 border border-[#1e3a5f] rounded-lg px-4 py-3 text-slate-300 font-mono text-sm">
              {userId}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(userId)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="btn-secondary px-4 py-3"
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
