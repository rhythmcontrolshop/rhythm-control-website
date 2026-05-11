// lib/checkout/release-order-stock.ts
// Función reutilizable para liberar stock reservado al cancelar/fallar un checkout
// Usada por /checkout/failure y /checkout/cancel (y cleanup endpoint si se necesita)

import { createAdminClient } from '@/lib/supabase/admin'

export interface ReleaseStockResult {
  released: boolean
  message: string
}

/**
 * Libera el stock reservado de una orden y la marca como cancelada.
 * Solo actúa si la orden está en estado payment_status='pending'.
 *
 * Flujo:
 * 1. Busca la orden por order_number
 * 2. Si no existe o no está pending → no hace nada
 * 3. Obtiene los order_items (release_ids)
 * 4. Llama a unreserve_releases RPC para liberar el stock
 * 5. Marca la orden como cancelled/failed
 */
export async function releaseOrderStock(orderNumber: string): Promise<ReleaseStockResult> {
  const supabase = createAdminClient()

  // ── 1. Buscar la orden ────────────────────────────────────────
  const { data: order } = await supabase
    .from('orders')
    .select('id, payment_status, status')
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (!order) {
    console.log('releaseOrderStock: order not found', orderNumber)
    return { released: false, message: 'Order not found' }
  }

  // ── 2. Solo liberar si está pendiente de pago ─────────────────
  if (order.payment_status !== 'pending') {
    console.log('releaseOrderStock: order not pending', orderNumber, order.payment_status)
    return { released: false, message: `Order status is ${order.payment_status}, not pending` }
  }

  // ── 3. Obtener items para liberar ────────────────────────────
  const { data: items } = await supabase
    .from('order_items')
    .select('release_id')
    .eq('order_id', order.id)

  const releaseIds = (items ?? [])
    .map(i => i.release_id)
    .filter((id): id is string => id !== null && id !== undefined)

  if (releaseIds.length > 0) {
    // ── 4. Liberar stock via RPC (atómico) ─────────────────────
    const { error: rpcError } = await supabase.rpc('unreserve_releases', {
      p_release_ids: releaseIds,
    })

    if (rpcError) {
      console.error('releaseOrderStock: failed to unreserve', orderNumber, rpcError)
      // No lanzamos error — el stock se queda reservado pero al menos el admin lo ve
    }
  }

  // ── 5. Marcar orden como cancelada ───────────────────────────
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      payment_status: 'failed',
    })
    .eq('id', order.id)
    .eq('payment_status', 'pending') // Guard: solo si sigue pending

  if (updateError) {
    console.error('releaseOrderStock: failed to cancel order', orderNumber, updateError)
  }

  console.log('releaseOrderStock: stock released for', orderNumber, `(${releaseIds.length} items)`)
  return { released: true, message: 'Stock released' }
}
