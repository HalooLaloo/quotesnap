import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimiter, getClientIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    if (rateLimiter) {
      const ip = getClientIP(request)
      const { success } = await rateLimiter.limit(ip)
      if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    }

    const { token } = await request.json()

    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Use service role for public access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Only update viewed_at if it's null (first view)
    const { error } = await supabase
      .from('qs_quotes')
      .update({ viewed_at: new Date().toISOString() })
      .eq('token', token)
      .is('viewed_at', null)
      .eq('status', 'sent') // Only track for sent quotes

    if (error) {
      console.error('Error tracking quote view:', error)
      return NextResponse.json(
        { error: 'Failed to track view' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track quote view API error:', error)
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
}
