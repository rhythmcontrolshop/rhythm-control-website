'use client'
import { useState } from 'react'
import { MOCK_RELEASES } from '@/lib/mock/releases'
import type { Release } from '@/types'

const MOCK_ORDERS = [
  { id: 'RC-001', customer: 'john@doe.com', date: '2026-04-12', total: 85.00, status: 'Pendiente' },
  { id: 'RC-002', customer: 'jane@example.com', date: '2026-04-11', total: 120.00, status: 'Enviado' },
  { id: 'RC-003', customer: 'listener@mail.com', date: '2026-04-10', total: 350.00, status: 'Entregado' },
]

export default function AdminInteractiveTools() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory')
  const [search, setSearch] = useState('')
  const [inventory, setInventory] = useState<Release[]>(MOCK_RELEASES as Release[])

  const filteredInventory = inventory.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.artists.some(a => a.toLowerCase().includes(search.toLowerCase()))
  )

  const updateQuantity = (id: string, newQty: number) => {
    setInventory(prev => prev.map(r => r.id === id ? { ...r, quantity: Math.max(0, newQty) } : r))
  }

  return (
    <section className="mt-10">
      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '2.5rem' }} />

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('inventory')}
          className="text-xs px-4 py-2 transition-colors"
          style={{
            border: '1px solid #d1d5db',
            backgroundColor: activeTab === 'inventory' ? '#000000' : '#FFFFFF',
            color: activeTab === 'inventory' ? '#FFFFFF' : '#374151',
          }}>
          INVENTARIO (MOCK)
        </button>
        <button onClick={() => setActiveTab('orders')}
          className="text-xs px-4 py-2 transition-colors"
          style={{
            border: '1px solid #d1d5db',
            backgroundColor: activeTab === 'orders' ? '#000000' : '#FFFFFF',
            color: activeTab === 'orders' ? '#FFFFFF' : '#374151',
          }}>
          PEDIDOS (MOCK)
        </button>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div>
          <input
            type="text"
            placeholder="BUSCAR EN MOCK..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-2 text-xs mb-4 focus:outline-none"
            style={{ border: '1px solid #d1d5db', color: '#000000', backgroundColor: '#FFFFFF' }}
          />
          <div className="overflow-x-auto" style={{ border: '1px solid #d1d5db' }}>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #000000' }}>
                  <th className="text-xs font-medium p-2" style={{ color: '#6b7280' }}>PORTADA</th>
                  <th className="text-xs font-medium p-2" style={{ color: '#6b7280' }}>ARTISTA / TÍTULO</th>
                  <th className="text-xs font-medium p-2" style={{ color: '#6b7280' }}>PRECIO</th>
                  <th className="text-xs font-medium p-2 text-center" style={{ color: '#6b7280' }}>STOCK</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td className="p-2"><img src={item.cover_image} alt={item.title} className="w-10 h-10 object-cover" style={{ border: '1px solid #d1d5db' }} /></td>
                    <td className="p-2">
                      <p className="text-xs font-bold uppercase" style={{ color: '#000000' }}>{item.artists[0]}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{item.title}</p>
                    </td>
                    <td className="text-xs p-2" style={{ color: '#000000' }}>{item.price.toFixed(2)} €</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          className="w-5 h-5 text-xs hover:bg-black hover:text-white transition-colors"
                          style={{ border: '1px solid #d1d5db', color: '#374151' }}>-</button>
                        <span className="w-6 text-center text-xs" style={{ color: '#000000' }}>{item.quantity || 1}</span>
                        <button onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="w-5 h-5 text-xs hover:bg-black hover:text-white transition-colors"
                          style={{ border: '1px solid #d1d5db', color: '#374151' }}>+</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="overflow-x-auto" style={{ border: '1px solid #d1d5db' }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #000000' }}>
                <th className="text-xs font-medium p-2" style={{ color: '#6b7280' }}>ID</th>
                <th className="text-xs font-medium p-2" style={{ color: '#6b7280' }}>CLIENTE</th>
                <th className="text-xs font-medium p-2" style={{ color: '#6b7280' }}>TOTAL</th>
                <th className="text-xs font-medium p-2" style={{ color: '#6b7280' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="text-xs p-2" style={{ color: '#000000' }}>{order.id}</td>
                  <td className="text-xs p-2" style={{ color: '#000000' }}>{order.customer}</td>
                  <td className="text-xs p-2" style={{ color: '#000000' }}>{order.total.toFixed(2)} €</td>
                  <td className="p-2">
                    <span className="text-xs px-2 py-1"
                      style={{
                        backgroundColor: order.status === 'Pendiente' ? '#fef9c3' : '#dcfce7',
                        color: order.status === 'Pendiente' ? '#854d0e' : '#166534',
                      }}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
