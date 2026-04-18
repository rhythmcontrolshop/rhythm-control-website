'use client'
// E3-17: Hover-only → CSS hover + always-visible visual cues
// E3-2: onMouseEnter/Leave → CSS classes

import Link from 'next/link'

export function StatCard({ label, value, href }: { label: string; value: string | number; href: string }) {
  // E3-2/E3-17: CSS hover instead of onMouseEnter/Leave
  return (
    <Link href={href} className="block p-4 transition-colors duration-200 hover:bg-[#1a1a1a] active:bg-[#1a1a1a]"
      style={{ border: '2px solid #FFFFFF', textDecoration: 'none', minHeight: '44px' }}>
      <p className="font-meta text-xs mb-2" style={{ color: '#FFFFFF' }}>{label}</p>
      <p className="font-display text-2xl" style={{ color: '#F0E040' }}>{value}</p>
    </Link>
  )
}

export function QuickLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  // E3-2/E3-17: CSS hover instead of onMouseEnter/Leave
  return (
    <Link href={href} target={external ? '_blank' : undefined}
      className="font-display text-xs px-5 py-3 text-center tracking-widest transition-colors duration-200 hover:bg-white hover:text-black active:bg-white active:text-black"
      style={{
        border: '2px solid #FFFFFF',
        color: '#FFFFFF',
        backgroundColor: '#000000',
        textDecoration: 'none',
        minHeight: '44px',
        display: 'inline-flex',
        alignItems: 'center',
      }}>
      {label}
    </Link>
  )
}

export function OrderRow({ order }: { order: any }) {
  // E3-2/E3-17: CSS hover instead of onMouseEnter/Leave
  return (
    <Link href="/cuenta/pedidos" className="block">
      <div className="flex items-center justify-between p-4 transition-colors duration-200 hover:bg-[#1a1a1a] active:bg-[#1a1a1a]"
        style={{ border: '2px solid #FFFFFF', minHeight: '44px' }}>
        <div>
          <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{order.order_number || order.id.slice(0, 8)}</p>
          <p className="font-meta text-xs" style={{ color: '#999' }}>{new Date(order.created_at).toLocaleDateString('es-ES')}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-sm" style={{ color: '#FFFFFF' }}>{Number(order.total).toFixed(2)} €</p>
        </div>
      </div>
    </Link>
  )
}
