// E2-9: redirect temporal (307) en vez de permanentRedirect (308)
import { redirect } from 'next/navigation'

export default function EventsPage() {
  redirect('/admin/agenda')
}
