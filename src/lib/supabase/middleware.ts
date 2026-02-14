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

  // Handle PKCE code exchange for password reset
  const code = request.nextUrl.searchParams.get('code')
  if (code && request.nextUrl.pathname === '/reset-password') {
    await supabase.auth.exchangeCodeForSession(code)
    // Strip code from URL and redirect (cookies are set on supabaseResponse)
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete('code')
    const redirectResponse = NextResponse.redirect(cleanUrl)
    // Copy cookies from supabaseResponse to redirect response
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public paths - no login required
  const publicPaths = ['/login', '/register', '/reset-password', '/request', '/quote', '/invoice', '/pricing', '/api', '/privacy', '/terms', '/contact', '/subscribe', '/unsubscribe', '/auth']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect unauthenticated users to login
  if (!user && !isPublicPath && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from login/register
  if (user) {
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') {
      const url = request.nextUrl.clone()
      url.pathname = '/requests'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
