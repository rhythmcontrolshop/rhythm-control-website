'use client'
import { logout } from './actions'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="font-display text-xs w-full py-3 tracking-widest transition-colors duration-200 hover:bg-[#F0E040] hover:text-black active:bg-[#F0E040] active:text-black"
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
