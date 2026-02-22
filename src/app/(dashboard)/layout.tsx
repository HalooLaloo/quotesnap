import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { OnboardingWrapper } from '@/components/OnboardingWrapper'
import { CheckoutSync } from '@/components/CheckoutSync'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has any services (for onboarding)
  const { count: servicesCount } = await supabase
    .from('qs_services')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Data for Getting Started checklist
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, phone')
    .eq('id', user.id)
    .single()

  const { count: requestsCount } = await supabase
    .from('qs_quote_requests')
    .select('*', { count: 'exact', head: true })
    .eq('contractor_id', user.id)

  const { count: quotesCount } = await supabase
    .from('qs_quotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: sentQuotesCount } = await supabase
    .from('qs_quotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['sent', 'accepted'])

  const checklistData = {
    userId: user.id,
    hasServices: (servicesCount || 0) > 0,
    hasProfile: !!(profile?.company_name && profile?.phone),
    hasRequests: (requestsCount || 0) > 0,
    hasQuotes: (quotesCount || 0) > 0,
    hasSentQuotes: (sentQuotesCount || 0) > 0,
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar userEmail={user.email || ''} checklistData={checklistData} />

      {/* Main content */}
      <main className="flex-1 overflow-auto lg:ml-0">
        {/* Mobile top padding for menu button + safe area */}
        <div className="lg:hidden h-20" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />
        {children}
      </main>

      {/* Onboarding modal for new users */}
      <OnboardingWrapper servicesCount={servicesCount || 0} userId={user.id} />
      <CheckoutSync />
    </div>
  )
}
