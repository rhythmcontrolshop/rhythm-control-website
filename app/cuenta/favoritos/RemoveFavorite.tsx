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
      className="font-meta text-xs underline hover:opacity-60 transition-opacity"
      style={{ color: '#FFFFFF' }}>
      {loading ? '...' : 'Eliminar'}
    </button>
  )
}
