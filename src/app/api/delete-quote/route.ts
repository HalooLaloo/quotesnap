import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quoteId } = await request.json()

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quoteId' }, { status: 400 })
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the quote belongs to the user
    const { data: quote } = await serviceClient
      .from('qs_quotes')
      .select('id, user_id')
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single()

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    const { error } = await serviceClient
      .from('qs_quotes')
      .delete()
      .eq('id', quoteId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete quote error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete quote API error:', error)
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 })
  }
}
