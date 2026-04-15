interface ReservationAlert {
  artistName: string; releaseName: string
  customerName: string; customerPhone: string; expiresAt: Date
}
export async function sendReservationAlert(data: ReservationAlert): Promise<void> {
  const phoneId  = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token    = process.env.WHATSAPP_ACCESS_TOKEN
  const toNumber = process.env.WHATSAPP_ADMIN_PHONE
  if (!phoneId || !token || !toNumber) return
  const expires = data.expiresAt.toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Madrid',
  })
  const body = [
    '🎵 *RESERVA — RHYTHM CONTROL*', '',
    `*Disco:* ${data.artistName} — ${data.releaseName}`,
    `*Cliente:* ${data.customerName}`,
    `*Tel:* ${data.customerPhone}`,
    `*Expira:* ${expires}`,
    '', 'Gestiona en /admin/reservations',
  ].join('\n')
  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: toNumber, type: 'text', text: { body } }),
  }).catch(() => {})
}
