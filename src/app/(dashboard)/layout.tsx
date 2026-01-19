import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

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

  return (
    <div className="min-h-screen flex">
      <Sidebar userEmail={user.email || ''} />

      {/* Main content */}
      <main className="flex-1 overflow-auto lg:ml-0">
        {/* Mobile top padding for hamburger */}
        <div className="lg:hidden h-16" />
        {children}
      </main>
    </div>
  )
}
