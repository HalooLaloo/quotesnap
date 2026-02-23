import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Short tracking links → /register with utm_source
const trackingRedirects: Record<string, string> = {
  '/try': 'ig_brand',
  '/go': 'ig_personal',
  '/start': 'fb_brand',
  '/free': 'email',
  '/join': 'tiktok',
  '/pro': 'youtube',
}

// Public paths - no login required
const publicPaths = ['/login', '/register', '/reset-password', '/request', '/quote', '/invoice', '/service', '/pricing', '/api', '/privacy', '/terms', '/contact', '/subscribe', '/unsubscribe', '/auth', '/checkout-complete']

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Catch token_hash from Supabase email confirmation and redirect to callback handler
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  if (tokenHash && !pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  // Handle tracking redirects
  const utmSource = trackingRedirects[pathname]
  if (utmSource) {
    const url = request.nextUrl.clone()
    url.pathname = '/register'
    url.searchParams.set('utm_source', utmSource)
    return NextResponse.redirect(url)
  }

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // Fast path: public pages without auth cookies — skip all Supabase calls
  const hasAuthCookies = request.cookies.getAll().some(c => c.name.startsWith('sb-'))
  if (isPublicPath && !hasAuthCookies) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getSession() instead of getUser() — reads JWT from cookie locally (no network call)
  // Real auth verification happens in dashboard layout via getUser()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const isNativeApp = request.headers.get('user-agent')?.includes('BrickQuoteApp')

  // Helper: create redirect that preserves refreshed auth cookies
  const redirectWithCookies = (redirectPath: string) => {
    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicPath && pathname !== '/') {
    return redirectWithCookies('/login')
  }

  if (user) {
    // Check subscription status — use cached cookie first, query DB only if missing
    let subscriptionStatus = request.cookies.get('bq_sub')?.value
    let hasAccess = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'

    if (!subscriptionStatus) {
      // Cache miss — query DB and set cookie for 5 minutes
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error(`[middleware] Profile query error for ${user.id}:`, profileError.message)
      }

      subscriptionStatus = profile?.subscription_status || 'inactive'
      hasAccess = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'

      // Cache in cookie for 5 minutes
      supabaseResponse.cookies.set('bq_sub', subscriptionStatus, {
        maxAge: 300,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      })
    }

    // Native app: block /register, /subscribe, /pricing
    if (isNativeApp) {
      const blockedInApp = ['/register', '/subscribe', '/pricing']
      if (blockedInApp.some(path => pathname.startsWith(path))) {
        return redirectWithCookies(hasAccess ? '/requests' : '/login')
      }
    }

    // Redirect logged-in users away from login/register
    if (pathname === '/login' || pathname === '/register') {
      if (isNativeApp && !hasAccess) {
        return supabaseResponse
      }
      return redirectWithCookies(hasAccess ? '/requests' : '/subscribe')
    }

    // Subscription enforcement — dashboard pages require active subscription
    const noSubRequired = ['/subscribe', '/settings']
    const isCheckoutReturn = request.nextUrl.searchParams.get('checkout') === 'success'
    const needsSubscription = !isPublicPath
      && pathname !== '/'
      && !isCheckoutReturn
      && !noSubRequired.some(p => pathname.startsWith(p))

    if (needsSubscription && !hasAccess) {
      return redirectWithCookies(isNativeApp ? '/login' : '/subscribe')
    }
  }

  return supabaseResponse
}
