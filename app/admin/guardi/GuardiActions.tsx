'use client'

export default function GuardiActions({ reservationId, orderId, status }: {
  reservationId?: string; orderId?: string; status: string
}) {
  async function action(action: string) {
    if (orderId) {
      // Order action via orders API
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'collect' ? 'collected' : 'cancelled' }),
      })
      if (res.ok) window.location.reload()
      else alert('Error al actualizar')
    } else if (reservationId) {
      // Legacy reservation action
      const res = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reservationId, action }),
      })
      if (res.ok) window.location.reload()
      else alert('Error al actualizar')
    }
  }

  return (
    <div className="flex gap-2">
      {(status === 'pending' || status === 'paid' || status === 'confirmed') && (
        <button onClick={() => action('collect')}
          className="text-xs px-3 py-2 transition-colors hover:opacity-90"
          style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
          RECOGIDO
        </button>
      )}
      {status === 'pending' && (
        <button onClick={() => action('confirm')}
          className="text-xs px-3 py-2 transition-colors hover:bg-black hover:text-white"
          style={{ border: '1px solid #d1d5db', color: '#374151' }}>
          CONFIRMAR
        </button>
      )}
      {(status === 'pending' || status === 'paid' || status === 'confirmed') && (
        <button onClick={() => { if (confirm('Cancelar?')) action('cancel') }}
          className="text-xs px-3 py-2 transition-colors hover:bg-red-500 hover:text-white"
          style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
          X
        </button>
      )}
    </div>
  )
}
