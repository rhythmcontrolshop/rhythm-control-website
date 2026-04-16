import AdminShell from '@/components/admin/AdminShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-admin-theme style={{ minHeight: '100dvh', backgroundColor: '#FFFFFF' }}>
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
