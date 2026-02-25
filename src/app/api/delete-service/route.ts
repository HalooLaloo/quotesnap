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

    const { serviceId } = await request.json()

    if (!serviceId) {
      return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 })
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await serviceClient
      .from('qs_services')
      .delete()
      .eq('id', serviceId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete service error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete service API error:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
