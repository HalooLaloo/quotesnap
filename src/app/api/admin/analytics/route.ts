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

  // MRR calculation: $29/mo for monthly, $249/12 = $20.75/mo for yearly
  const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID
  const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID
  let mrr = 0
  for (const u of enrichedUsers) {
    if (u.subscription_status !== 'active') continue
    if (u.stripe_price_id === yearlyPriceId) {
      mrr += 249 / 12
    } else if (u.stripe_price_id === monthlyPriceId) {
      mrr += 29
    }
  }

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

  // PostHog analytics (last 30 days) via HogQL Query API
  let pageViews: { path: string; views: number }[] = []
  let totalViews = 0
  let uniqueVisitors = 0
  let dailyViews: { date: string; views: number }[] = []
  let topReferrers: { referrer: string; views: number }[] = []
  let topUtmSources: { source: string; views: number }[] = []
  let topCountries: { country: string; code: string; visitors: number }[] = []

  const posthogKey = process.env.POSTHOG_PERSONAL_API_KEY
  const posthogProjectId = process.env.POSTHOG_PROJECT_ID
  if (posthogKey && posthogProjectId) {
    const phUrl = `https://us.posthog.com/api/projects/${posthogProjectId}/query/`
    const phHeaders = {
      Authorization: `Bearer ${posthogKey}`,
      'Content-Type': 'application/json',
    }

    const hogql = async (query: string) => {
      const res = await fetch(phUrl, {
        method: 'POST',
        headers: phHeaders,
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
      })
      if (!res.ok) return []
      const data = await res.json()
      return data.results || []
    }

    // All queries in parallel
    const [pagesRows, totalRow, visitorsRow, dailyRows, referrerRows, utmRows, countryRows] = await Promise.all([
      // Top pages
      hogql("SELECT properties['$pathname'] as path, count() as views FROM events WHERE event = '$pageview' AND timestamp > now() - interval 30 day GROUP BY path ORDER BY views DESC LIMIT 15"),
      // Total views
      hogql("SELECT count() as views FROM events WHERE event = '$pageview' AND timestamp > now() - interval 30 day"),
      // Unique visitors
      hogql("SELECT count(DISTINCT distinct_id) as visitors FROM events WHERE event = '$pageview' AND timestamp > now() - interval 30 day"),
      // Daily visitors
      hogql("SELECT toDate(timestamp) as day, count(DISTINCT distinct_id) as visitors FROM events WHERE event = '$pageview' AND timestamp > now() - interval 30 day GROUP BY day ORDER BY day"),
      // Top referrers
      hogql("SELECT properties['$referring_domain'] as referrer, count() as views FROM events WHERE event = '$pageview' AND timestamp > now() - interval 30 day AND referrer != '' GROUP BY referrer ORDER BY views DESC LIMIT 10"),
      // UTM sources
      hogql("SELECT properties['utm_source'] as source, count() as views FROM events WHERE event = '$pageview' AND timestamp > now() - interval 30 day AND source != '' GROUP BY source ORDER BY views DESC LIMIT 10"),
      // Visitors by country
      hogql("SELECT properties['$geoip_country_name'] as country, properties['$geoip_country_code'] as code, count(DISTINCT distinct_id) as visitors FROM events WHERE event = '$pageview' AND timestamp > now() - interval 30 day AND country != '' GROUP BY country, code ORDER BY visitors DESC LIMIT 20"),
    ])

    pageViews = pagesRows.map((r: any[]) => ({ path: r[0] || '/', views: r[1] }))
    totalViews = totalRow[0]?.[0] || 0
    uniqueVisitors = visitorsRow[0]?.[0] || 0
    dailyViews = dailyRows.map((r: any[]) => ({ date: r[0], views: r[1] }))
    topReferrers = referrerRows.map((r: any[]) => ({ referrer: r[0] || 'direct', views: r[1] }))
    topUtmSources = utmRows.map((r: any[]) => ({ source: r[0], views: r[1] }))
    topCountries = countryRows.map((r: any[]) => ({ country: r[0], code: r[1], visitors: r[2] }))
  }

  return NextResponse.json({
    overview: {
      totalUsers: users.length,
      activeSubscriptions: activeUsers.length,
      trials: trialingUsers.length,
      last7Days: enrichedUsers.filter(u => new Date(u.created_at) >= sevenDaysAgo).length,
      last30Days: enrichedUsers.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length,
      mrr: Math.round(mrr * 100) / 100,
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
    topCountries,
  })
}
