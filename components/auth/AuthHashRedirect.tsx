'use client'
// E3-24: AuthHashRedirect with minimal flash — handles redirect immediately
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthHashRedirect() {
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')

    // PKCE code flow — no redirect needed, let the page handle it
    if (code) return

    // Hash fragment flow — redirect to reset-password page
    if (hash && hash.includes('type=recovery')) {
      setRedirecting(true)
      // E3-24: Use replace to avoid flash in history
      router.replace('/admin/reset-password' + hash)
    }
  }, [router])

  // E3-24: Show minimal indicator during redirect instead of blank flash
  if (redirecting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#000000', zIndex: 9999 }}>
        <div className="inline-block w-6 h-6 border-2 border-t-transparent animate-spin" style={{ borderColor: '#F0E040', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return null
}
