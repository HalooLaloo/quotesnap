import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Save FCM token for push notifications.
 * Called from WebView JavaScript (injected by iOS AppDelegate or web code).
 * Authenticates via session cookies — no userId in body needed.
 */
export async function POST(request: NextRequest) {
  try {
    const { token, platform } = await request.json()

    if (!token || !platform) {
      return NextResponse.json({ error: 'Missing token or platform' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Read current tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse existing tokens
    let tokens: { t: string; p: string }[] = []
    if (profile.fcm_token) {
      try {
        const parsed = JSON.parse(profile.fcm_token)
        if (Array.isArray(parsed)) tokens = parsed
      } catch {
        if (profile.fcm_token.length > 10) {
          tokens = [{ t: profile.fcm_token, p: 'android' }]
        }
      }
    }

    // Check if this exact token is already saved
    if (tokens.some(t => t.t === token && t.p === platform)) {
      return NextResponse.json({ ok: true, status: 'already_saved' })
    }

    // Replace token for this platform, or add new
    const updated = tokens.filter(t => t.p !== platform)
    updated.push({ t: token, p: platform })

    await supabase
      .from('profiles')
      .update({ fcm_token: JSON.stringify(updated) })
      .eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
