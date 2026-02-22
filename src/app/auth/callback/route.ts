import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/requests'

  // If Supabase sent an error (e.g. OTP expired)
  if (error) {
    if (next === '/reset-password') {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`)
    }
    return NextResponse.redirect(`${origin}/login?verified=true`)
  }

  // token_hash flow (works cross-device, no PKCE needed)
  if (tokenHash && type) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'recovery' | 'email',
    })

    if (!verifyError) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }

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

        return NextResponse.redirect(`${origin}${hasActiveSubscription ? next : '/subscribe'}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }

    // token_hash verification failed (expired/invalid)
    console.error('verifyOtp failed:', verifyError.message, verifyError)
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`)
    }
    return NextResponse.redirect(`${origin}/login?error=verification_expired&reason=${encodeURIComponent(verifyError.message)}`)
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
      if (next === '/reset-password') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }

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

        return NextResponse.redirect(`${origin}${hasActiveSubscription ? next : '/subscribe'}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    // PKCE error (likely different device/browser or expired code)
    if (next === '/reset-password') {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`)
    }
    return NextResponse.redirect(`${origin}/login?verified=true`)
  }

  // No code - redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
