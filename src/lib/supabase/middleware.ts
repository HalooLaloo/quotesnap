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
  const publicPaths = ['/login', '/register', '/request', '/quote', '/invoice', '/pricing', '/api', '/privacy', '/terms', '/contact', '/subscribe', '/auth']
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
