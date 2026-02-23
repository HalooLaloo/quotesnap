import { createClient } from '@/lib/supabase/server'
import { ServicesList } from './ServicesList'
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/countries'

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const [{ data: services }, { data: profile }] = await Promise.all([
    supabase.from('qs_services').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('country').eq('id', user?.id).single(),
  ])

  const countryCode = profile?.country || DEFAULT_COUNTRY
  const country = COUNTRIES[countryCode] || COUNTRIES[DEFAULT_COUNTRY]

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">My Services</h1>
        <p className="text-slate-400 text-sm mt-1">
          Your price list — AI uses it to generate accurate quotes.
        </p>
      </div>

      <ServicesList
        services={services || []}
        currencySymbol={country.currencySymbol}
        measurementSystem={country.measurementSystem}
      />
    </div>
  )
}
