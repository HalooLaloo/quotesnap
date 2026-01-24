import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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

  // Public paths - no login required
  const publicPaths = ['/login', '/register', '/request', '/quote', '/pricing', '/api', '/privacy', '/terms', '/contact', '/subscribe']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect unauthenticated users to login
  if (!user && !isPublicPath && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check subscription status for logged-in users
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    const hasActiveSubscription =
      profile?.subscription_status === 'active' ||
      profile?.subscription_status === 'trialing'

    // Logged-in users on login/register page
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') {
      const url = request.nextUrl.clone()
      // Redirect to subscribe if no subscription, otherwise to requests
      url.pathname = hasActiveSubscription ? '/requests' : '/subscribe'
      return NextResponse.redirect(url)
    }

    // Protected routes - require subscription
    if (!isPublicPath && request.nextUrl.pathname !== '/') {
      if (!hasActiveSubscription) {
        const url = request.nextUrl.clone()
        url.pathname = '/subscribe'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
