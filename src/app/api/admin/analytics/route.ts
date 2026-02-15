import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = ['pawellewandowsky@gmail.com']

export async function GET() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Service role client to access auth.users
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all users
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const users = usersData?.users || []

  // Fetch all profiles with subscription data
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, company_name, subscription_status, stripe_price_id, created_at')

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  // Build analytics
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Users with enriched data
  const enrichedUsers = users.map(u => {
    const profile = profileMap.get(u.id)
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      utm_source: u.user_metadata?.utm_source || null,
      full_name: profile?.full_name || null,
      company_name: profile?.company_name || null,
      subscription_status: profile?.subscription_status || null,
      stripe_price_id: profile?.stripe_price_id || null,
    }
  })

  // Signups by source
  const sourceMap: Record<string, { total: number; paid: number }> = {}
  for (const u of enrichedUsers) {
    const source = u.utm_source || 'direct'
    if (!sourceMap[source]) sourceMap[source] = { total: 0, paid: 0 }
    sourceMap[source].total++
    if (u.subscription_status === 'active' || u.subscription_status === 'trialing') {
      sourceMap[source].paid++
    }
  }

  const signupsBySource = Object.entries(sourceMap)
    .map(([source, data]) => ({
      source,
      total: data.total,
      paid: data.paid,
      conversion: data.total > 0 ? Math.round((data.paid / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // Revenue metrics
  const activeUsers = enrichedUsers.filter(u =>
    u.subscription_status === 'active' || u.subscription_status === 'trialing'
  )
  const trialingUsers = enrichedUsers.filter(u => u.subscription_status === 'trialing')

  // Signups over time (last 30 days, grouped by day)
  const dailySignups: Record<string, number> = {}
  for (const u of enrichedUsers) {
    const date = new Date(u.created_at).toISOString().split('T')[0]
    if (new Date(u.created_at) >= thirtyDaysAgo) {
      dailySignups[date] = (dailySignups[date] || 0) + 1
    }
  }

  const timeline = Object.entries(dailySignups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Recent signups (last 20)
  const recentSignups = [...enrichedUsers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map(u => ({
      email: u.email,
      name: u.full_name || u.company_name || '-',
      source: u.utm_source || 'direct',
      status: u.subscription_status || 'none',
      created_at: u.created_at,
    }))

  // PostHog page views (last 30 days)
  let pageViews: { path: string; views: number }[] = []
  let totalViews = 0
  let uniqueVisitors = 0
  let dailyViews: { date: string; views: number }[] = []
  let topReferrers: { referrer: string; views: number }[] = []
  let topUtmSources: { source: string; views: number }[] = []

  const posthogKey = process.env.POSTHOG_PERSONAL_API_KEY
  const posthogProjectId = process.env.POSTHOG_PROJECT_ID
  if (posthogKey && posthogProjectId) {
    const phHost = 'https://us.posthog.com'
    const dateFrom = thirtyDaysAgo.toISOString().split('T')[0]

    // Top pages
    try {
      const pagesRes = await fetch(`${phHost}/api/projects/${posthogProjectId}/insights/trend/?` + new URLSearchParams({
        events: JSON.stringify([{ id: '$pageview', math: 'total' }]),
        date_from: dateFrom,
        breakdown: '$pathname',
        breakdown_type: 'event',
      }), {
        headers: { Authorization: `Bearer ${posthogKey}` },
      })

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json()
        const results = pagesData.result || []
        pageViews = results
          .map((r: any) => ({
            path: r.breakdown_value || r.label || 'unknown',
            views: (r.data || []).reduce((sum: number, v: number) => sum + v, 0),
          }))
          .sort((a: any, b: any) => b.views - a.views)
          .slice(0, 15)

        totalViews = results.reduce((sum: number, r: any) =>
          sum + (r.data || []).reduce((s: number, v: number) => s + v, 0), 0)
      }
    } catch {}

    // Top referrers
    try {
      const refRes = await fetch(`${phHost}/api/projects/${posthogProjectId}/insights/trend/?` + new URLSearchParams({
        events: JSON.stringify([{ id: '$pageview', math: 'total' }]),
        date_from: dateFrom,
        breakdown: '$referring_domain',
        breakdown_type: 'event',
      }), {
        headers: { Authorization: `Bearer ${posthogKey}` },
      })

      if (refRes.ok) {
        const refData = await refRes.json()
        topReferrers = (refData.result || [])
          .map((r: any) => ({
            referrer: r.breakdown_value || 'direct',
            views: (r.data || []).reduce((sum: number, v: number) => sum + v, 0),
          }))
          .filter((r: any) => r.views > 0)
          .sort((a: any, b: any) => b.views - a.views)
          .slice(0, 10)
      }
    } catch {}

    // Top UTM sources (traffic)
    try {
      const utmRes = await fetch(`${phHost}/api/projects/${posthogProjectId}/insights/trend/?` + new URLSearchParams({
        events: JSON.stringify([{ id: '$pageview', math: 'total' }]),
        date_from: dateFrom,
        breakdown: '$utm_source',
        breakdown_type: 'event',
      }), {
        headers: { Authorization: `Bearer ${posthogKey}` },
      })

      if (utmRes.ok) {
        const utmData = await utmRes.json()
        topUtmSources = (utmData.result || [])
          .map((r: any) => ({
            source: r.breakdown_value || 'none',
            views: (r.data || []).reduce((sum: number, v: number) => sum + v, 0),
          }))
          .filter((r: any) => r.views > 0 && r.source !== 'none')
          .sort((a: any, b: any) => b.views - a.views)
          .slice(0, 10)
      }
    } catch {}

    // Unique visitors
    try {
      const visitorsRes = await fetch(`${phHost}/api/projects/${posthogProjectId}/insights/trend/?` + new URLSearchParams({
        events: JSON.stringify([{ id: '$pageview', math: 'dau' }]),
        date_from: dateFrom,
      }), {
        headers: { Authorization: `Bearer ${posthogKey}` },
      })

      if (visitorsRes.ok) {
        const visitorsData = await visitorsRes.json()
        const result = visitorsData.result?.[0]
        if (result) {
          uniqueVisitors = (result.data || []).reduce((sum: number, v: number) => sum + v, 0)
          dailyViews = (result.labels || []).map((label: string, i: number) => ({
            date: label,
            views: result.data?.[i] || 0,
          }))
        }
      }
    } catch {}
  }

  return NextResponse.json({
    overview: {
      totalUsers: users.length,
      activeSubscriptions: activeUsers.length,
      trials: trialingUsers.length,
      last7Days: enrichedUsers.filter(u => new Date(u.created_at) >= sevenDaysAgo).length,
      last30Days: enrichedUsers.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length,
      totalViews,
      uniqueVisitors,
    },
    signupsBySource,
    timeline,
    recentSignups,
    pageViews,
    dailyViews,
    topReferrers,
    topUtmSources,
  })
}
