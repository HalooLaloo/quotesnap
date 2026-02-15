'use client'

import { useEffect, useState } from 'react'

interface OverviewData {
  totalUsers: number
  activeSubscriptions: number
  trials: number
  last7Days: number
  last30Days: number
}

interface SourceData {
  source: string
  total: number
  paid: number
  conversion: number
}

interface TimelinePoint {
  date: string
  count: number
}

interface RecentSignup {
  email: string
  name: string
  source: string
  status: string
  created_at: string
}

interface PageView {
  path: string
  views: number
}

interface ReferrerData {
  referrer: string
  views: number
}

interface UtmSourceData {
  source: string
  views: number
}

interface CountryData {
  country: string
  code: string
  visitors: number
}

interface AnalyticsData {
  overview: OverviewData & { mrr: number; totalViews: number; uniqueVisitors: number }
  signupsBySource: SourceData[]
  timeline: TimelinePoint[]
  recentSignups: RecentSignup[]
  pageViews: PageView[]
  dailyViews: { date: string; views: number }[]
  topReferrers: ReferrerData[]
  topUtmSources: UtmSourceData[]
  topCountries: CountryData[]
}

export default function AdminPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then(setData)
      .catch(() => setError('Access denied'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-slate-400">Loading analytics...</div>
  if (error) return <div className="p-8 text-red-400">{error}</div>
  if (!data) return null

  const maxTimeline = Math.max(...data.timeline.map(t => t.count), 1)

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

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
        <StatCard label="Signups 7d" value={data.overview.last7Days} color="orange" />
        <StatCard label="Signups 30d" value={data.overview.last30Days} color="orange" />
        <StatCard label="Page Views 30d" value={data.overview.totalViews} color="purple" />
        <StatCard label="Unique Visitors" value={data.overview.uniqueVisitors} color="purple" />
      </div>

      {/* Signups by Source */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Signups by Source</h2>
        {data.signupsBySource.length === 0 ? (
          <p className="text-slate-500 text-sm">No data yet</p>
        ) : (
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
        )}
      </div>

      {/* Traffic Sources - side by side */}
      {(data.topReferrers.length > 0 || data.topUtmSources.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Referrers */}
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
                      <div className="flex-1 bg-slate-800 rounded-full h-4 relative">
                        <div
                          className="bg-emerald-500/40 rounded-full h-4"
                          style={{ width: `${(r.views / maxRef) * 100}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-sm w-12 text-right shrink-0">{r.views}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* UTM Sources (campaign traffic) */}
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
                      <div className="flex-1 bg-slate-800 rounded-full h-4 relative">
                        <div
                          className="bg-orange-500/40 rounded-full h-4"
                          style={{ width: `${(u.views / maxUtm) * 100}%` }}
                        />
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
          <h2 className="text-lg font-semibold text-white mb-4">Visitors by Country - Last 30 Days</h2>
          <div className="space-y-2">
            {data.topCountries.map(c => {
              const maxC = data.topCountries[0]?.visitors || 1
              return (
                <div key={c.code} className="flex items-center gap-3">
                  <span className="text-lg w-7 shrink-0">{countryFlag(c.code)}</span>
                  <span className="text-slate-300 text-sm w-32 truncate shrink-0" title={c.country}>
                    {c.country}
                  </span>
                  <div className="flex-1 bg-slate-800 rounded-full h-4 relative">
                    <div
                      className="bg-cyan-500/40 rounded-full h-4"
                      style={{ width: `${(c.visitors / maxC) * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-400 text-sm w-12 text-right shrink-0">{c.visitors}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Timeline (last 30 days) */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Signups - Last 30 Days</h2>
        {data.timeline.length === 0 ? (
          <p className="text-slate-500 text-sm">No data yet</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {data.timeline.map(t => (
              <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-slate-500">{t.count}</span>
                <div
                  className="w-full bg-blue-500 rounded-t min-h-[4px]"
                  style={{ height: `${(t.count / maxTimeline) * 120}px` }}
                  title={`${t.date}: ${t.count} signups`}
                />
                <span className="text-[10px] text-slate-600 -rotate-45 origin-top-left whitespace-nowrap">
                  {t.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Visitors (PostHog) */}
      {data.dailyViews.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Daily Visitors - Last 30 Days</h2>
          <div className="flex items-end gap-1 h-40">
            {data.dailyViews.map(t => {
              const maxDV = Math.max(...data.dailyViews.map(d => d.views), 1)
              return (
                <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
                  {t.views > 0 && <span className="text-xs text-slate-500">{t.views}</span>}
                  <div
                    className="w-full bg-purple-500 rounded-t min-h-[2px]"
                    style={{ height: `${(t.views / maxDV) * 120}px` }}
                    title={`${t.date}: ${t.views} visitors`}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Pages (PostHog) */}
      {data.pageViews.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Top Pages - Last 30 Days</h2>
          <div className="space-y-2">
            {data.pageViews.map(p => {
              const maxPV = data.pageViews[0]?.views || 1
              return (
                <div key={p.path} className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm w-48 truncate shrink-0" title={p.path}>{p.path}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-5 relative">
                    <div
                      className="bg-purple-500/40 rounded-full h-5"
                      style={{ width: `${(p.views / maxPV) * 100}%` }}
                    />
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

function countryFlag(code: string) {
  if (!code || code.length !== 2) return '🌍'
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
