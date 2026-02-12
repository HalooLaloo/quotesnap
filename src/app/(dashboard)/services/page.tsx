import { createClient } from '@/lib/supabase/server'
import { ServicesList } from './ServicesList'
import { AddServiceForm } from './AddServiceForm'
import { PageGuideCard } from '@/components/onboarding/PageGuideCard'

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: services } = await supabase
    .from('qs_services')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Services</h1>
        <p className="text-slate-400 mt-1">
          Manage your service catalog and pricing. These are the services you can add to quotes.
        </p>
      </div>

      <PageGuideCard
        pageKey="services"
        userId={user!.id}
        icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        title="Your Price List"
        description="These are your services with prices. AI uses this list when suggesting quote line items for client requests. Keep your prices up to date for accurate quotes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Service Form */}
        <div className="lg:col-span-1">
          <AddServiceForm />
        </div>

        {/* Services List */}
        <div className="lg:col-span-2">
          <ServicesList services={services || []} />
        </div>
      </div>
    </div>
  )
}
