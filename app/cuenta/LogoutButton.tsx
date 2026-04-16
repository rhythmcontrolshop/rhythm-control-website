'use client'
import { logout } from './actions'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="font-display text-xs px-5 py-2 tracking-widest transition-colors duration-200"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#000000',
          border: '2px solid #000000',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0E040' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}
      >
        SALIR
      </button>
    </form>
  )
}
