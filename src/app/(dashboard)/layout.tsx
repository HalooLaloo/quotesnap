import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { OnboardingWrapper } from '@/components/OnboardingWrapper'

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

  return (
    <div className="min-h-screen flex">
      <Sidebar userEmail={user.email || ''} />

      {/* Main content */}
      <main className="flex-1 overflow-auto lg:ml-0">
        {/* Mobile top padding for hamburger */}
        <div className="lg:hidden h-16" />
        {children}
      </main>

      {/* Onboarding modal for new users */}
      <OnboardingWrapper servicesCount={servicesCount || 0} />
    </div>
  )
}
