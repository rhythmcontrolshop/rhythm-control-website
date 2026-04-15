'use client'

import { logout } from './actions'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="font-meta text-xs transition-colors"
        style={{ color: '#FFFFFF' }}
      >
        SALIR
      </button>
    </form>
  )
}
