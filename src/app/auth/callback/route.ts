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

  // Native app: auth callbacks must open in Chrome directly (bypass Android app link interception)
  const isNativeApp = request.headers.get('user-agent')?.includes('BrickQuoteApp')
  if (isNativeApp && (tokenHash || code)) {
    const callbackUrl = request.url
    // Parse URL to build intent:// URI that forces Chrome
    const parsed = new URL(callbackUrl)
    const intentUrl = `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=https;package=com.android.chrome;end`
    return new Response(`<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a1628;color:white;font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center">
<p style="font-size:18px;margin-bottom:12px">Confirm your email</p>
<p style="font-size:14px;color:#94a3b8;margin-bottom:30px">Opening in Chrome...</p>
<a id="btn" href="${intentUrl}" style="background:#3b82f6;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:16px;display:inline-block;margin-bottom:16px">Open in Chrome</a>
<p style="font-size:12px;color:#64748b;margin-top:20px">If Chrome doesn't open, copy this link and paste in Chrome:</p>
<input readonly value="${callbackUrl}" style="width:100%;padding:10px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:12px;margin-top:8px" onclick="this.select()">
<script>
// Auto-click the intent link to open Chrome immediately
try { document.getElementById('btn').click(); } catch(e) {}
</script>
</body></html>`, { headers: { 'content-type': 'text/html' } })
  }

  // If Supabase sent an error (e.g. OTP expired)
  if (error) {
    if (next === '/reset-password') {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`)
    }
    return NextResponse.redirect(`${origin}/login?error=verification_failed`)
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
    return NextResponse.redirect(`${origin}/login?error=verification_failed`)
  }

  // No code - redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
