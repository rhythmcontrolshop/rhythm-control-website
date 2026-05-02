// app/cuenta/actions.ts
// Server actions para la sección de cuenta del usuario.
// E1-10: claim-anonymous-orders — vincula pedidos anónimos al usuario registrado.

'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Vincula pedidos anónimos (user_id=NULL) al usuario autenticado
 * basándose en la coincidencia de email.
 *
 * Esto resuelve el problema de que los pedidos realizados antes
 * del registro no son visibles por RLS (orders_own_read requiere user_id = auth.uid()).
 */
export async function claimAnonymousOrders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'No autorizado' }
  }

  const admin = createAdminClient()

  // Buscar órdenes anónimas con el mismo email
  const { data: anonymousOrders, error: findError } = await admin
    .from('orders')
    .select('id, customer_email')
    .is('user_id', null)
    .eq('customer_email', user.email)

  if (findError) {
    console.error('Error finding anonymous orders:', findError)
    return { error: 'Error al buscar pedidos' }
  }

  if (!anonymousOrders || anonymousOrders.length === 0) {
    return { claimed: 0 }
  }

  // Vincular las órdenes al usuario
  const orderIds = anonymousOrders.map(o => o.id)
  const { error: updateError } = await admin
    .from('orders')
    .update({ user_id: user.id })
    .in('id', orderIds)

  if (updateError) {
    console.error('Error claiming orders:', updateError)
    return { error: 'Error al vincular pedidos' }
  }

  revalidatePath('/cuenta/pedidos')
  return { claimed: orderIds.length }
}

/**
 * Cerrar sesión del usuario (usado por LogoutButton)
 */
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
