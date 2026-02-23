import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimiter, getClientIP } from '@/lib/ratelimit'
import { verifyUnsubscribeToken } from '@/lib/emailFooter'

export async function POST(request: NextRequest) {
  try {
    if (rateLimiter) {
      const ip = getClientIP(request)
      const { success } = await rateLimiter.limit(ip)
      if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    }

    const { userId, action, token } = await request.json()

    if (!userId || !action || !token) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    if (action !== 'unsubscribe' && action !== 'resubscribe') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Verify HMAC token to prevent unauthorized manipulation
    if (!verifyUnsubscribeToken(userId, token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('profiles')
      .update({ email_notifications: action === 'resubscribe' })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
