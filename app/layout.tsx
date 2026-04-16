import type { Metadata } from 'next'
import { Space_Mono } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import { LocaleProvider } from '@/context/LocaleContext'
import CartDrawer from '@/components/cart/CartDrawer'

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
})

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
    <html lang="es" className={spaceMono.variable}>
      <body style={{ backgroundColor: '#000000' }}>
        <LocaleProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
