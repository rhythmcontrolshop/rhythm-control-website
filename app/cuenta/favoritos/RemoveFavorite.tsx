'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RemoveFavorite({ favoriteId }: { favoriteId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function remove() {
    setLoading(true)
    await fetch('/api/cuenta/favoritos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: favoriteId })
    })
    router.refresh()
  }

  return (
    <button onClick={remove} disabled={loading}
      className="font-meta text-xs px-4 py-2 transition-colors duration-200"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#000000',
        border: '2px solid #000000',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#F0E040' }}
      onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#FFFFFF' }}>
      {loading ? '...' : 'ELIMINAR'}
    </button>
  )
}
