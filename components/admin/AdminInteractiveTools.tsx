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
      <hr className="separator mb-10" />

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('inventory')} className={`font-display text-xs px-4 py-2 border-2 ${activeTab === 'inventory' ? 'bg-black text-white border-black' : 'border-white text-white hover:bg-white hover:text-black'}`}>
          INVENTARIO (MOCK)
        </button>
        <button onClick={() => setActiveTab('orders')} className={`font-display text-xs px-4 py-2 border-2 ${activeTab === 'orders' ? 'bg-black text-white border-black' : 'border-white text-white hover:bg-white hover:text-black'}`}>
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
            className="w-full p-2 border-2 border-white bg-transparent font-mono text-xs mb-4 text-white placeholder-gray-500"
          />
          <div className="overflow-x-auto border-2 border-white">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white text-black">
                  <th className="font-display text-xs p-2">PORTADA</th>
                  <th className="font-display text-xs p-2">ARTISTA / TÍTULO</th>
                  <th className="font-display text-xs p-2">PRECIO</th>
                  <th className="font-display text-xs p-2 text-center">STOCK</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="p-2"><img src={item.cover_image} alt={item.title} className="w-10 h-10 object-cover" /></td>
                    <td className="p-2"><p className="font-display text-xs uppercase">{item.artists[0]}</p><p className="font-mono text-xs text-gray-400">{item.title}</p></td>
                    <td className="font-display text-xs p-2">{item.price.toFixed(2)} €</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)} className="font-display w-5 h-5 border border-white text-white hover:bg-white hover:text-black">-</button>
                        <span className="font-mono w-6 text-center text-white">{item.quantity || 1}</span>
                        <button onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)} className="font-display w-5 h-5 border border-white text-white hover:bg-white hover:text-black">+</button>
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
        <div className="overflow-x-auto border-2 border-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-black">
                <th className="font-display text-xs p-2">ID</th>
                <th className="font-display text-xs p-2">CLIENTE</th>
                <th className="font-display text-xs p-2">TOTAL</th>
                <th className="font-display text-xs p-2">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS.map(order => (
                <tr key={order.id} className="border-b border-gray-800">
                  <td className="font-mono text-xs p-2 text-white">{order.id}</td>
                  <td className="font-mono text-xs p-2 text-white">{order.customer}</td>
                  <td className="font-display text-xs p-2 text-white">{order.total.toFixed(2)} €</td>
                  <td className="p-2"><span className={`font-display text-xs px-2 py-1 ${order.status === 'Pendiente' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-black'}`}>{order.status.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
