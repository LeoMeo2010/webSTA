import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageTitle, Card, Input, Select, Btn } from '@/components/shared/ui'

interface CreatedUser {
  full_name: string
  email: string
  password: string
  role: string
}

export default function AdminInviteUser() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedUser | null>(null)

  // Genera password casuale sicura
  function generatePassword() {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
    setPassword(Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
  }

  async function handleCreate() {
    setError('')
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Compila tutti i campi.')
      return
    }
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.')
      return
    }

    setLoading(true)
    try {
      // Registra l'utente tramite il normale signUp
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } }
      })
      if (signUpErr) throw signUpErr
      if (!data.user) throw new Error('Utente non creato.')

      // Se il ruolo richiesto è admin, aggiorna subito il profilo
      if (role === 'admin') {
        await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', data.user.id)
      }

      setCreated({ full_name: fullName.trim(), email: email.trim(), password, role })
      setFullName(''); setEmail(''); setPassword(''); setRole('student')
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione.')
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <PageTitle>Crea account</PageTitle>

      <Card style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-dim)' }}>
          ➕ Nuovo utente
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Crea un account direttamente senza passare dalla registrazione pubblica.
          Poi comunica le credenziali all'utente.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Nome e cognome *"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Mario Rossi"
          />
          <Input
            label="Email *"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="mario.rossi@email.com"
          />
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Password *
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="min. 6 caratteri"
                style={{
                  flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '0.55rem 0.8rem', color: 'var(--text)',
                  fontSize: '0.88rem', fontFamily: 'JetBrains Mono', outline: 'none'
                }}
              />
              <Btn size="sm" variant="ghost" onClick={generatePassword} title="Genera password casuale">
                🎲 Genera
              </Btn>
            </div>
          </div>
          <Select
            label="Ruolo"
            value={role}
            onChange={e => setRole(e.target.value as 'student' | 'admin')}
          >
            <option value="student">🎓 Studente</option>
            <option value="admin">👤 Amministratore</option>
          </Select>

          {error && <p style={{ color: 'var(--red)', fontSize: '0.82rem', margin: 0 }}>{error}</p>}

          <Btn onClick={handleCreate} disabled={loading} style={{ alignSelf: 'flex-start' }}>
            {loading ? 'Creazione...' : '✅ Crea account'}
          </Btn>
        </div>
      </Card>

      {/* Riepilogo credenziali */}
      {created && (
        <Card style={{ padding: '1.5rem', borderColor: 'rgba(34,197,94,0.3)', borderWidth: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--green)', margin: 0 }}>
              Account creato!
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Comunica queste credenziali all'utente. Salvale ora — la password non verrà mostrata di nuovo.
          </p>

          {[
            { label: 'Nome', value: created.full_name },
            { label: 'Email', value: created.email },
            { label: 'Password', value: created.password },
            { label: 'Ruolo', value: created.role },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem 0.75rem', marginBottom: '0.4rem',
              background: 'var(--surface2)', borderRadius: 8
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>{row.label}</div>
                <div style={{
                  fontFamily: row.label === 'Password' || row.label === 'Email' ? 'JetBrains Mono' : 'Syne',
                  fontSize: '0.85rem', fontWeight: 600
                }}>{row.value}</div>
              </div>
              {(row.label === 'Password' || row.label === 'Email') && (
                <button
                  onClick={() => copyToClipboard(row.value)}
                  style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                    color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem 0.5rem',
                    fontSize: '0.72rem', fontFamily: 'Syne'
                  }}
                >
                  📋 Copia
                </button>
              )}
            </div>
          ))}

          <Btn
            variant="ghost"
            size="sm"
            style={{ marginTop: '0.75rem' }}
            onClick={() => setCreated(null)}
          >
            Crea un altro account
          </Btn>
        </Card>
      )}
    </div>
  )
}
