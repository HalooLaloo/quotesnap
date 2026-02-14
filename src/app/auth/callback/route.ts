import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/requests'

  // If Supabase sent an error, redirect to login
  if (error) {
    // Email might still be verified, suggest manual login
    return NextResponse.redirect(`${origin}/login?verified=true`)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore errors in server context
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has active subscription
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single()

        const hasActiveSubscription =
          profile?.subscription_status === 'active' ||
          profile?.subscription_status === 'trialing'

        // Redirect to subscribe if no subscription, otherwise to next
        const redirectTo = hasActiveSubscription ? next : '/subscribe'
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    // PKCE error (likely different device/browser) - email is already verified by Supabase
    // Redirect to login with message to log in manually
    return NextResponse.redirect(`${origin}/login?verified=true`)
  }

  // No code - redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
