'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string; email: string; username: string | null
  full_name: string | null; role: string; created_at: string
}

export default function EquipoPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Invite form
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [inviting, setInviting] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users ?? [])
      }
    } catch { setError('Error de conexión') }
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const action = newRole === 'admin' ? 'dar permisos de admin' : 'quitar permisos de admin'
    if (!confirm(`¿Seguro que quieres ${action} a este usuario?`)) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg(`Rol actualizado a ${newRole}`)
        fetchUsers()
      } else {
        setError(data.error || 'Error al actualizar rol')
      }
    } catch {
      setError('Error de conexión')
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setMsg(null)
    setError(null)

    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          password: invitePassword,
          username: inviteUsername,
          role: inviteRole,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg(data.message || 'Usuario invitado correctamente')
        setShowInvite(false)
        setInviteEmail('')
        setInvitePassword('')
        setInviteUsername('')
        fetchUsers()
      } else {
        setError(data.error || 'Error al invitar usuario')
      }
    } catch {
      setError('Error de conexión')
    }
    setInviting(false)
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const customerCount = users.filter(u => u.role === 'customer').length

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6"
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin" className="text-xs hover:underline" style={{ color: '#6b7280' }}>← VOLVER</Link>
        <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>EQUIPO</h1>
        <div />
      </div>

      {msg && <div className="mb-4 p-3" style={{ border: '1px solid #22c55e', backgroundColor: '#f0fdf4' }}><p className="text-xs" style={{ color: '#22c55e' }}>{msg}</p></div>}
      {error && <div className="mb-4 p-3" style={{ border: '1px solid #ef4444', backgroundColor: '#fef2f2' }}><p className="text-xs" style={{ color: '#ef4444' }}>{error}</p></div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>ADMINISTRADORES</p>
          <p className="text-2xl font-bold" style={{ color: '#000000' }}>{adminCount}</p>
        </div>
        <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>CLIENTES</p>
          <p className="text-2xl font-bold" style={{ color: '#000000' }}>{customerCount}</p>
        </div>
        <div className="p-4" style={{ border: '1px solid #e5e7eb' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>TOTAL</p>
          <p className="text-2xl font-bold" style={{ color: '#000000' }}>{users.length}</p>
        </div>
      </div>

      {/* Invite button */}
      <div className="mb-6">
        <button onClick={() => setShowInvite(!showInvite)}
          className="text-xs px-6 py-3 transition-colors hover:opacity-90"
          style={{ backgroundColor: '#000000', color: '#FFFFFF', cursor: 'pointer' }}>
          {showInvite ? 'CANCELAR' : '+ INVITAR MIEMBRO'}
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="mb-8 p-6" style={{ border: '2px solid #000000' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#000000' }}>INVITAR NUEVO MIEMBRO</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#6b7280' }}>EMAIL *</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                required placeholder="nuevo@rhythmcontrol.es"
                className="w-full text-sm px-3 py-2 focus:outline-none"
                style={{ border: '1px solid #d1d5db', color: '#000000' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#6b7280' }}>CONTRASEÑA *</label>
              <input type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)}
                required minLength={6} placeholder="Mínimo 6 caracteres"
                className="w-full text-sm px-3 py-2 focus:outline-none"
                style={{ border: '1px solid #d1d5db', color: '#000000' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#6b7280' }}>NOMBRE DE USUARIO</label>
              <input type="text" value={inviteUsername} onChange={e => setInviteUsername(e.target.value)}
                placeholder="Opcional — se usa el email si está vacío"
                className="w-full text-sm px-3 py-2 focus:outline-none"
                style={{ border: '1px solid #d1d5db', color: '#000000' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#6b7280' }}>ROL</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="text-sm px-3 py-2 focus:outline-none"
                style={{ border: '1px solid #d1d5db', color: '#000000' }}>
                <option value="admin">Admin — Acceso completo al panel</option>
                <option value="customer">Cliente — Solo tienda</option>
              </select>
            </div>
            <button type="submit" disabled={inviting}
              className="text-xs px-6 py-3 transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#22c55e', color: '#FFFFFF', cursor: 'pointer' }}>
              {inviting ? 'CREANDO...' : 'CREAR USUARIO'}
            </button>
          </form>
          <p className="text-xs mt-4" style={{ color: '#9ca3af' }}>
            El usuario recibirá acceso inmediato con estas credenciales. Puede cambiar la contraseña después.
          </p>
        </div>
      )}

      {/* Users list */}
      {loading ? (
        <p className="text-xs animate-pulse" style={{ color: '#6b7280' }}>Cargando...</p>
      ) : users.length === 0 ? (
        <p className="text-xs" style={{ color: '#6b7280' }}>No hay usuarios registrados.</p>
      ) : (
        <div style={{ border: '1px solid #d1d5db' }}>
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 p-3" style={{ borderBottom: '2px solid #000000', backgroundColor: '#f9fafb' }}>
            <div className="col-span-3 text-xs font-medium" style={{ color: '#6b7280' }}>EMAIL</div>
            <div className="col-span-2 text-xs font-medium" style={{ color: '#6b7280' }}>USUARIO</div>
            <div className="col-span-3 text-xs font-medium" style={{ color: '#6b7280' }}>NOMBRE</div>
            <div className="col-span-2 text-xs font-medium" style={{ color: '#6b7280' }}>ROL</div>
            <div className="col-span-2 text-xs font-medium text-right" style={{ color: '#6b7280' }}>ACCIONES</div>
          </div>
          {users.map(user => (
            <div key={user.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-gray-50"
              style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div className="col-span-3 text-sm truncate" style={{ color: '#000000' }}>{user.email}</div>
              <div className="col-span-2 text-sm truncate" style={{ color: '#6b7280' }}>{user.username || '—'}</div>
              <div className="col-span-3 text-sm truncate" style={{ color: '#6b7280' }}>{user.full_name || '—'}</div>
              <div className="col-span-2">
                <span className="text-xs px-2 py-1"
                  style={{
                    border: `1px solid ${user.role === 'admin' ? '#22c55e' : '#d1d5db'}`,
                    color: user.role === 'admin' ? '#22c55e' : '#6b7280',
                  }}>
                  {user.role === 'admin' ? 'ADMIN' : 'CLIENTE'}
                </span>
              </div>
              <div className="col-span-2 text-right">
                {user.role === 'admin' ? (
                  <button onClick={() => handleRoleChange(user.id, 'customer')}
                    className="text-xs px-2 py-1 transition-colors hover:bg-red-50"
                    style={{ border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer' }}>
                    Quitar admin
                  </button>
                ) : (
                  <button onClick={() => handleRoleChange(user.id, 'admin')}
                    className="text-xs px-2 py-1 transition-colors hover:bg-green-50"
                    style={{ border: '1px solid #22c55e', color: '#22c55e', cursor: 'pointer' }}>
                    Hacer admin
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help section */}
      <div className="mt-10 p-6" style={{ border: '1px solid #e5e7eb' }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#000000' }}>CÓMO FUNCIONA EL ACCESO ADMIN</h3>
        <ul className="text-xs leading-relaxed space-y-2" style={{ color: '#6b7280' }}>
          <li><strong>Registro:</strong> Los usuarios se registran en /registro como clientes (role = &quot;customer&quot;). Por defecto no tienen acceso al admin.</li>
          <li><strong>Acceso admin:</strong> Solo los usuarios con role = &quot;admin&quot; en la tabla <code style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '0 4px' }}>profiles</code> pueden entrar a /admin.</li>
          <li><strong>Invitar:</strong> Usa el formulario de arriba para crear cuentas de admin directamente con email + contraseña.</li>
          <li><strong>Cambiar rol:</strong> Usa los botones &quot;Hacer admin&quot; / &quot;Quitar admin&quot; para cambiar el rol de cualquier usuario existente.</li>
          <li><strong>Protección:</strong> No puedes quitarte el rol de admin a ti mismo. Siempre debe haber al menos un admin.</li>
        </ul>
        <div className="mt-4 p-3" style={{ border: '1px solid #f59e0b', backgroundColor: '#fffbeb' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#92400e' }}>ACCESO DE EMERGENCIA</p>
          <p className="text-xs" style={{ color: '#92400e' }}>
            Si pierdes el acceso admin, puedes cambiar el rol directamente en Supabase:
            ve a Table Editor → profiles → busca tu usuario → cambia &quot;role&quot; de &quot;customer&quot; a &quot;admin&quot;.
          </p>
        </div>
      </div>
    </div>
  )
}
