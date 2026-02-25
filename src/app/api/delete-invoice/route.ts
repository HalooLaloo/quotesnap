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

    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the invoice belongs to the user
    const { data: invoice } = await serviceClient
      .from('qs_invoices')
      .select('id, user_id')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { error } = await serviceClient
      .from('qs_invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete invoice error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete invoice API error:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
