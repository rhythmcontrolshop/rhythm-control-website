'use client'

export default function GuardiActions({ reservationId, orderId, status }: {
  reservationId?: string; orderId?: string; status: string
}) {
  async function action(action: string) {
    try {
      if (orderId) {
        // Order action via orders API
        const newStatus = action === 'collect' ? 'collected' : action === 'confirm' ? 'confirmed' : 'cancelled'
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (res.ok) {
          window.location.reload()
        } else {
          const data = await res.json().catch(() => ({ error: 'Error al actualizar' }))
          alert(data.error || 'Error al actualizar')
        }
      } else if (reservationId) {
        // Reservation action via admin reservations API
        const res = await fetch('/api/admin/reservations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: reservationId, action }),
        })
        if (res.ok) {
          window.location.reload()
        } else {
          const data = await res.json().catch(() => ({ error: 'Error al actualizar' }))
          alert(data.error || 'Error al actualizar')
        }
      }
    } catch {
      alert('Error de conexión')
    }
  }

  return (
    <div className="flex gap-2">
      {(status === 'pending' || status === 'paid' || status === 'confirmed') && (
        <button onClick={() => action('collect')}
          className="text-xs px-3 py-2 transition-colors hover:opacity-90"
          style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}>
          RECOGIDO
        </button>
      )}
      {status === 'pending' && (
        <button onClick={() => action('confirm')}
          className="text-xs px-3 py-2 transition-colors hover:bg-black hover:text-white"
          style={{ border: '1px solid #d1d5db', color: '#374151', cursor: 'pointer' }}>
          CONFIRMAR
        </button>
      )}
      {(status === 'pending' || status === 'paid' || status === 'confirmed') && (
        <button onClick={() => { if (confirm('Cancelar?')) action('cancel') }}
          className="text-xs px-3 py-2 transition-colors hover:bg-red-500 hover:text-white"
          style={{ border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer' }}>
          X
        </button>
      )}
    </div>
  )
}
