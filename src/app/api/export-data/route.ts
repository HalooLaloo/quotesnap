import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user data in parallel
    const [profileRes, requestsRes, quotesRes, invoicesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('qs_quote_requests').select('*').eq('contractor_id', user.id),
      supabase.from('qs_quotes').select('*').eq('user_id', user.id),
      supabase.from('qs_invoices').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profileRes.data,
      quote_requests: requestsRes.data || [],
      quotes: quotesRes.data || [],
      invoices: invoicesRes.data || [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="brickquote-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Export data error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
