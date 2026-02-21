import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PageTitle, Card, Spinner, Btn } from '@/components/shared/ui'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ exercises: 0, submissions: 0, pending: 0, graded: 0 })
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('exercises').select('id', { count: 'exact', head: true }),
      supabase.from('submissions').select('id,status', { count: 'exact' }),
    ]).then(([ex, sub]) => {
      const subs = sub.data ?? []
      setStats({
        exercises: ex.count ?? 0,
        submissions: subs.length,
        pending: subs.filter(s => s.status === 'pending').length,
        graded: subs.filter(s => s.status === 'graded').length,
      })
    })

    supabase
      .from('submissions')
      .select('id, status, submitted_at, student:profiles(full_name), exercise:exercises(title)')
      .order('submitted_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentSubmissions(data ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const statItems = [
    { label: 'Esercizi pubblicati', value: stats.exercises, color: 'var(--accent)' },
    { label: 'Invii totali', value: stats.submissions, color: 'var(--accent2)' },
    { label: 'Da valutare', value: stats.pending, color: '#eab308' },
    { label: 'Valutati', value: stats.graded, color: 'var(--green)' },
  ]

  return (
    <div>
      <PageTitle>Dashboard Admin</PageTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {statItems.map(s => (
          <Card key={s.label} style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Invii recenti</h2>
            <Link to="/admin/submissions" style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none' }}>Vedi tutti →</Link>
          </div>
          {recentSubmissions.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nessun invio ancora.</p>
            : recentSubmissions.map(s => (
              <div key={s.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.65rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.exercise?.title ?? '—'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.student?.full_name ?? '—'}</div>
                </div>
                <span style={{
                  padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
                  fontFamily: 'JetBrains Mono',
                  background: s.status === 'graded' ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
                  color: s.status === 'graded' ? '#22c55e' : '#eab308',
                  border: `1px solid ${s.status === 'graded' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`
                }}>
                  {s.status === 'graded' ? 'VALUTATO' : 'IN ATTESA'}
                </span>
              </div>
            ))
          }
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Azioni rapide</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/admin/exercises/new">
              <Btn style={{ width: '100%' }}>📝 Crea nuovo esercizio</Btn>
            </Link>
            <Link to="/admin/submissions">
              <Btn variant="ghost" style={{ width: '100%' }}>📤 Vedi invii da valutare</Btn>
            </Link>
            <Link to="/admin/exercises">
              <Btn variant="ghost" style={{ width: '100%' }}>📋 Gestisci esercizi</Btn>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
