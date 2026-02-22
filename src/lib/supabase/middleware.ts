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
  const publicPaths = ['/login', '/register', '/reset-password', '/request', '/quote', '/invoice', '/pricing', '/api', '/privacy', '/terms', '/contact', '/subscribe', '/unsubscribe', '/auth', '/checkout-complete']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect unauthenticated users to login
  if (!user && !isPublicPath && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Check subscription status first — needed for all redirects below
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    const hasAccess =
      profile?.subscription_status === 'active' ||
      profile?.subscription_status === 'trialing'

    // Native app: block /register, /subscribe, /pricing
    if (isNativeApp) {
      const blockedInApp = ['/register', '/subscribe', '/pricing']
      if (blockedInApp.some(path => request.nextUrl.pathname.startsWith(path))) {
        const url = request.nextUrl.clone()
        url.pathname = user ? (hasAccess ? '/requests' : '/login') : '/login'
        return NextResponse.redirect(url)
      }
    }

    // Redirect logged-in users away from login/register
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') {
      const url = request.nextUrl.clone()
      url.pathname = hasAccess ? '/requests' : '/subscribe'
      return NextResponse.redirect(url)
    }

    // Subscription enforcement — dashboard pages require active subscription
    const noSubRequired = ['/subscribe', '/settings']
    const isCheckoutReturn = request.nextUrl.searchParams.get('checkout') === 'success'
    const needsSubscription = !isPublicPath
      && request.nextUrl.pathname !== '/'
      && !isCheckoutReturn
      && !noSubRequired.some(p => request.nextUrl.pathname.startsWith(p))

    if (needsSubscription && !hasAccess) {
      const url = request.nextUrl.clone()
      url.pathname = isNativeApp ? '/login' : '/subscribe'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
