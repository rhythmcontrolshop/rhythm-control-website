import { redirect } from 'next/navigation'

export default function OrderDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 16: params is a Promise
  void params.then(({ id }) => {
    redirect(`/admin/pedidos/${id}`)
  })
  return null
}
