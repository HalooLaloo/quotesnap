import { SupabaseClient } from '@supabase/supabase-js'

/** Server-side: check if user has active subscription */
export async function hasProAccess(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .single()

  const status = data?.subscription_status
  return status === 'active' || status === 'trialing'
}

/** Free tier quote limit for native app users */
export const FREE_QUOTE_LIMIT = 5
