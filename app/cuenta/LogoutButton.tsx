'use client'
import { logout } from './actions'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="font-display text-xs w-full py-3 tracking-widest transition-colors duration-200 hover:bg-[#ef4444] hover:text-white active:bg-[#ef4444] active:text-white"
        style={{
          backgroundColor: '#000000',
          color: '#999999',
          border: '2px solid #333',
          cursor: 'pointer',
          minHeight: '44px',
        }}
      >
        CERRAR SESIÓN
      </button>
    </form>
  )
}
