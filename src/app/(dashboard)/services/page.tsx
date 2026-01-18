import { createClient } from '@/lib/supabase/server'
import { ServicesList } from './ServicesList'
import { AddServiceForm } from './AddServiceForm'

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
