import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Btn, Input } from '@/components/shared/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Credenziali non valide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, #7c52ff, #f97316)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'JetBrains Mono', fontSize: '1.2rem', fontWeight: 700,
            color: 'white', margin: '0 auto 1rem'
          }}>K</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.3rem' }}>Web STA</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Accedi alla piattaforma</p>
        </div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '1.75rem'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="nome@email.com" />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            {error && <p style={{ color: 'var(--red)', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
            <Btn type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Accesso...' : 'Accedi'}
            </Btn>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Non hai un account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>Registrati</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
