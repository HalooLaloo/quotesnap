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

export async function updateSession(request: NextRequest) {
  // Catch token_hash from Supabase email confirmation and redirect to callback handler
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  if (tokenHash && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  const utmSource = trackingRedirects[request.nextUrl.pathname]
  if (utmSource) {
    const url = request.nextUrl.clone()
    url.pathname = '/register'
    url.searchParams.set('utm_source', utmSource)
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isNativeApp = request.headers.get('user-agent')?.includes('BrickQuoteApp')

  // Public paths - no login required
  // Use exact match OR path prefix with '/' to avoid false matches
  // e.g. '/request' should match '/request/123' but NOT '/requests'
  const publicPaths = ['/login', '/register', '/reset-password', '/request', '/quote', '/invoice', '/pricing', '/api', '/privacy', '/terms', '/contact', '/subscribe', '/unsubscribe', '/auth', '/checkout-complete']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )

  // Helper: create redirect that preserves refreshed auth cookies
  const redirectWithCookies = (pathname: string) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    const redirectResponse = NextResponse.redirect(url)
    // Copy any refreshed auth cookies from supabaseResponse to redirect
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicPath && request.nextUrl.pathname !== '/') {
    console.error(`[middleware] No user for ${request.nextUrl.pathname} (native=${isNativeApp})`)
    return redirectWithCookies('/login')
  }

  if (user) {
    // Check subscription status first — needed for all redirects below
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error(`[middleware] Profile query error for ${user.id}:`, profileError.message)
    }

    const hasAccess =
      profile?.subscription_status === 'active' ||
      profile?.subscription_status === 'trialing'

    // Native app: block /register, /subscribe, /pricing
    if (isNativeApp) {
      const blockedInApp = ['/register', '/subscribe', '/pricing']
      if (blockedInApp.some(path => request.nextUrl.pathname.startsWith(path))) {
        return redirectWithCookies(hasAccess ? '/requests' : '/login')
      }
    }

    // Redirect logged-in users away from login/register
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') {
      // Native app user without subscription — let them stay on /login (avoids redirect loop)
      if (isNativeApp && !hasAccess) {
        return supabaseResponse
      }
      return redirectWithCookies(hasAccess ? '/requests' : '/subscribe')
    }

    // Subscription enforcement — dashboard pages require active subscription
    const noSubRequired = ['/subscribe', '/settings']
    const isCheckoutReturn = request.nextUrl.searchParams.get('checkout') === 'success'
    const needsSubscription = !isPublicPath
      && request.nextUrl.pathname !== '/'
      && !isCheckoutReturn
      && !noSubRequired.some(p => request.nextUrl.pathname.startsWith(p))

    if (needsSubscription && !hasAccess) {
      // If the profile query failed (e.g. parallel request race condition),
      // don't block — let the page through, dashboard layout has its own auth check
      if (profileError) {
        return supabaseResponse
      }
      console.error(`[middleware] No subscription for ${request.nextUrl.pathname} user=${user.id} status=${profile?.subscription_status} native=${isNativeApp}`)
      return redirectWithCookies(isNativeApp ? '/login' : '/subscribe')
    }
  }

  return supabaseResponse
}
