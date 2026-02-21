import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'admin'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navLinks = isAdmin
    ? [
        { to: '/admin', label: '📊 Dashboard', end: true },
        { to: '/admin/exercises', label: '📝 Esercizi' },
        { to: '/admin/submissions', label: '📤 Invii' },
      ]
    : [
        { to: '/student', label: '🏠 Home', end: true },
        { to: '/student/grades', label: '⭐ I miei voti' },
      ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,14,23,0.97)',
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>
            <div style={{
              width: 30, height: 30,
              background: 'linear-gradient(135deg, #7c52ff, #f97316)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: 'white', fontWeight: 700
            }}>K</div>
            KotlinEval
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                style={({ isActive }) => ({
                  padding: '0.35rem 0.85rem',
                  borderRadius: 7,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-muted)',
                })}
              >{link.label}</NavLink>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            padding: '0.25rem 0.7rem', borderRadius: 20,
            fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            background: isAdmin ? 'rgba(249,115,22,0.12)' : 'rgba(124,106,247,0.12)',
            color: isAdmin ? 'var(--accent2)' : 'var(--accent)',
            border: `1px solid ${isAdmin ? 'rgba(249,115,22,0.25)' : 'rgba(124,106,247,0.25)'}`
          }}>
            {isAdmin ? '👤 ADMIN' : '🎓 STUDENT'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile?.full_name}</span>
          <button onClick={handleSignOut} style={{
            padding: '0.35rem 0.8rem', borderRadius: 7, border: '1px solid var(--border)',
            background: 'var(--surface2)', color: 'var(--text-dim)', fontSize: '0.78rem',
            cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 600
          }}>Esci</button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  )
}
