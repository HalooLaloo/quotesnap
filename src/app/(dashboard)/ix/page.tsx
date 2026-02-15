'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

type Range = '1d' | '7d' | '30d' | '365d'
const RANGES: { key: Range; label: string }[] = [
  { key: '1d', label: '1D' },
  { key: '7d', label: '1W' },
  { key: '30d', label: '1M' },
  { key: '365d', label: '1Y' },
]

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeSubscriptions: number
    trials: number
    last7Days: number
    signupsInRange: number
    mrr: number
    totalViews: number
    uniqueVisitors: number
  }
  signupsBySource: { source: string; total: number; paid: number; conversion: number }[]
  timeline: { date: string; count: number }[]
  recentSignups: { email: string; name: string; source: string; status: string; created_at: string }[]
  pageViews: { path: string; views: number }[]
  dailyViews: { date: string; views: number }[]
  topReferrers: { referrer: string; views: number }[]
  topUtmSources: { source: string; views: number }[]
  topCountries: { country: string; code: string; visitors: number }[]
}

const rangeLabel = (r: Range) => ({ '1d': 'Today', '7d': '7 Days', '30d': '30 Days', '365d': '1 Year' }[r])

export default function AdminPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState<Range>('30d')

  const fetchData = useCallback((r: Range) => {
    setLoading(true)
    fetch(`/api/admin/analytics?range=${r}`)
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then(setData)
      .catch(() => setError('Access denied'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData(range) }, [range, fetchData])

  if (error) return <div className="p-8 text-red-400">{error}</div>
  if (!data && loading) return <div className="p-8 text-slate-400">Loading analytics...</div>
  if (!data) return null

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header + Range Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                range === r.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-slate-500 text-sm">Updating...</div>}

      {/* MRR Hero Card */}
      <div className="card !p-6 border border-green-500/30 bg-green-500/5">
        <p className="text-slate-400 text-xs uppercase tracking-wide">Monthly Recurring Revenue</p>
        <p className="text-4xl font-bold mt-2 text-green-400">
          ${data.overview.mrr.toFixed(2)}
        </p>
        <p className="text-slate-500 text-xs mt-1">
          {data.overview.activeSubscriptions} active &middot; {data.overview.trials} trialing
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data.overview.totalUsers} />
        <StatCard label="Active Subs" value={data.overview.activeSubscriptions} color="green" />
        <StatCard label="Trials" value={data.overview.trials} color="blue" />
        <StatCard label={`Signups ${rangeLabel(range)}`} value={data.overview.signupsInRange} color="orange" />
        <StatCard label={`Views ${rangeLabel(range)}`} value={data.overview.totalViews} color="purple" />
        <StatCard label="Unique Visitors" value={data.overview.uniqueVisitors} color="purple" />
      </div>

      {/* Visitors Chart */}
      {data.dailyViews.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Visitors</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyViews}>
                <defs>
                  <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#475569"
                  fontSize={11}
                  tickFormatter={d => formatDate(d, range)}
                />
                <YAxis stroke="#475569" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#a78bfa' }}
                  labelFormatter={d => formatTooltipDate(d)}
                />
                <Area type="monotone" dataKey="views" name="Visitors" stroke="#8b5cf6" fill="url(#gradVisitors)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Signups Chart */}
      {data.timeline.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Signups</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline}>
                <defs>
                  <linearGradient id="gradSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#475569"
                  fontSize={11}
                  tickFormatter={d => formatDate(d, range)}
                />
                <YAxis stroke="#475569" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#60a5fa' }}
                  labelFormatter={d => formatTooltipDate(d)}
                />
                <Area type="monotone" dataKey="count" name="Signups" stroke="#3b82f6" fill="url(#gradSignups)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Signups by Source */}
      {data.signupsBySource.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Signups by Source</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 pr-4">Source</th>
                  <th className="text-right py-2 px-4">Signups</th>
                  <th className="text-right py-2 px-4">Paid</th>
                  <th className="text-right py-2 px-4">Conversion</th>
                  <th className="py-2 pl-4 w-40"></th>
                </tr>
              </thead>
              <tbody>
                {data.signupsBySource.map(s => (
                  <tr key={s.source} className="border-b border-slate-800">
                    <td className="py-3 pr-4">
                      <span className="text-white font-medium">{s.source}</span>
                    </td>
                    <td className="text-right py-3 px-4 text-slate-300">{s.total}</td>
                    <td className="text-right py-3 px-4 text-green-400">{s.paid}</td>
                    <td className="text-right py-3 px-4 text-slate-300">{s.conversion}%</td>
                    <td className="py-3 pl-4">
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-blue-500 rounded-full h-2 transition-all"
                          style={{ width: `${Math.min(s.conversion, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Traffic Sources - side by side */}
      {(data.topReferrers.length > 0 || data.topUtmSources.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.topReferrers.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Top Referrers</h2>
              <div className="space-y-2">
                {data.topReferrers.map(r => {
                  const maxRef = data.topReferrers[0]?.views || 1
                  return (
                    <div key={r.referrer} className="flex items-center gap-3">
                      <span className="text-slate-300 text-sm w-36 truncate shrink-0" title={r.referrer}>
                        {r.referrer || 'direct'}
                      </span>
                      <div className="flex-1 bg-slate-800 rounded-full h-4">
                        <div className="bg-emerald-500/40 rounded-full h-4" style={{ width: `${(r.views / maxRef) * 100}%` }} />
                      </div>
                      <span className="text-slate-400 text-sm w-12 text-right shrink-0">{r.views}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {data.topUtmSources.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Campaign Traffic (UTM)</h2>
              <div className="space-y-2">
                {data.topUtmSources.map(u => {
                  const maxUtm = data.topUtmSources[0]?.views || 1
                  return (
                    <div key={u.source} className="flex items-center gap-3">
                      <span className="text-slate-300 text-sm w-36 truncate shrink-0" title={u.source}>
                        {u.source}
                      </span>
                      <div className="flex-1 bg-slate-800 rounded-full h-4">
                        <div className="bg-orange-500/40 rounded-full h-4" style={{ width: `${(u.views / maxUtm) * 100}%` }} />
                      </div>
                      <span className="text-slate-400 text-sm w-12 text-right shrink-0">{u.views}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visitors by Country */}
      {data.topCountries?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Visitors by Country</h2>
          <div className="space-y-2">
            {data.topCountries.map(c => {
              const maxC = data.topCountries[0]?.visitors || 1
              return (
                <div key={c.code} className="flex items-center gap-3">
                  <span className="text-lg w-7 shrink-0">{countryFlag(c.code)}</span>
                  <span className="text-slate-300 text-sm w-32 truncate shrink-0" title={c.country}>
                    {c.country}
                  </span>
                  <div className="flex-1 bg-slate-800 rounded-full h-4">
                    <div className="bg-cyan-500/40 rounded-full h-4" style={{ width: `${(c.visitors / maxC) * 100}%` }} />
                  </div>
                  <span className="text-slate-400 text-sm w-12 text-right shrink-0">{c.visitors}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Pages */}
      {data.pageViews.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Top Pages</h2>
          <div className="space-y-2">
            {data.pageViews.map(p => {
              const maxPV = data.pageViews[0]?.views || 1
              return (
                <div key={p.path} className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm w-48 truncate shrink-0" title={p.path}>{p.path}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-5">
                    <div className="bg-purple-500/40 rounded-full h-5" style={{ width: `${(p.views / maxPV) * 100}%` }} />
                  </div>
                  <span className="text-slate-400 text-sm w-16 text-right shrink-0">{p.views}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Signups */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Signups</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 pr-4">Email</th>
                <th className="text-left py-2 px-4">Name</th>
                <th className="text-left py-2 px-4">Source</th>
                <th className="text-left py-2 px-4">Status</th>
                <th className="text-right py-2 pl-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSignups.map(u => (
                <tr key={u.email} className="border-b border-slate-800">
                  <td className="py-3 pr-4 text-white">{u.email}</td>
                  <td className="py-3 px-4 text-slate-300">{u.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.source === 'direct'
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {u.source}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="py-3 pl-4 text-right text-slate-400 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function formatDate(d: string, range: Range) {
  if (range === '1d') return d.slice(11, 16)
  if (range === '365d') return d.slice(0, 7)
  return d.slice(5)
}

function formatTooltipDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return d }
}

function countryFlag(code: string) {
  if (!code || code.length !== 2) return '\u{1F30D}'
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const colorClass = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
  }[color || ''] || 'text-white'

  return (
    <div className="card !p-4">
      <p className="text-slate-400 text-xs uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Active' },
    trialing: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Trial' },
    canceled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Canceled' },
    past_due: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Past Due' },
  }
  const c = config[status] || { bg: 'bg-slate-700', text: 'text-slate-400', label: status || 'None' }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}
