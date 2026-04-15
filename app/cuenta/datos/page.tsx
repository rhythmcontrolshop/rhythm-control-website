export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import UpdateProfileForm from './UpdateProfileForm'
import ShippingAddressForm from './ShippingAddressForm'

export default async function DatosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl mb-10" style={{ color: '#FFFFFF' }}>
        MIS DATOS
      </h1>

      <div className="space-y-8">
        <section>
          <p className="font-meta text-xs mb-4" style={{ color: '#FFFFFF' }}>
            DATOS PERSONALES
          </p>
          <UpdateProfileForm profile={profile} />
        </section>

        <hr className="separator" />

        <section>
          <p className="font-meta text-xs mb-4" style={{ color: '#FFFFFF' }}>
            DIRECCIÓN DE ENVÍO
          </p>
          <ShippingAddressForm profile={profile} />
        </section>
      </div>
    </div>
  )
}
