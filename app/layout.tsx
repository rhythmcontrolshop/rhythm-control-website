import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import CartDrawer from '@/components/cart/CartDrawer'

export const metadata: Metadata = {
  title: 'RHYTHM CONTROL',
  description: 'Tienda de vinilos en Barcelona',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body style={{ backgroundColor: '#000000' }}>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}
