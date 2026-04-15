'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Customer {
  id: string; full_name: string | null; email: string | null; phone: string | null
  created_at: string; order_count: number; total_spent: number
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('q', debouncedSearch)
    const res = await fetch(`/api/admin/customers?${params}`)
    if (res.ok) {
      const data = await res.json()
      setCustomers(data.customers ?? [])
    }
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 className="text-xl font-bold" style={{ color: '#000000' }}>CLIENTES</h1>
        <span className="text-xs" style={{ color: '#6b7280' }}>{customers.length} registrados</span>
      </div>

      <div className="mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full md:w-80 text-sm px-4 py-2 focus:outline-none"
          style={{ border: '1px solid #d1d5db', color: '#000000' }} />
      </div>

      {loading ? (
        <p className="text-xs animate-pulse py-8 text-center" style={{ color: '#6b7280' }}>CARGANDO...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: '2px solid #000000' }}>
                {['NOMBRE', 'EMAIL', 'TELEFONO', 'PEDIDOS', 'TOTAL GASTADO', 'DESDE'].map((h, i) => (
                  <th key={i} className="text-xs font-medium px-3 py-3" style={{ color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-sm" style={{ color: '#9ca3af' }}>Sin clientes</td></tr>
              )}
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="px-3 py-3">
                    <Link href={`/cuenta/datos?id=${c.id}`} className="text-sm font-bold" style={{ color: '#000000' }}>
                      {c.full_name || '—'}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-sm" style={{ color: '#6b7280' }}>{c.email || '—'}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>{c.phone || '—'}</td>
                  <td className="px-3 py-3">
                    <span className="text-sm font-bold" style={{ color: c.order_count > 0 ? '#000000' : '#9ca3af' }}>
                      {c.order_count}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#000000' }}>
                    {c.total_spent ? (c.total_spent / 100).toFixed(2) + ' EUR' : '0 EUR'}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>
                    {new Date(c.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
