// components/admin/LogoutButton.tsx
import { logout } from '@/app/admin/login/actions'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="font-meta text-xs transition-colors"
        style={{ color: '#6b7280' }}
      >
        SALIR
      </button>
    </form>
  )
}
