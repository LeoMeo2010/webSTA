import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PageTitle, Card, Btn, Badge, Spinner, Empty } from '@/components/shared/ui'

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSubmissions() }, [])

  async function fetchSubmissions() {
    const { data } = await supabase
      .from('submissions')
      .select('id, status, submitted_at, student:profiles(full_name), exercise:exercises(title, difficulty), grade:grades(total_score)')
      .order('submitted_at', { ascending: false })
    setSubmissions(data ?? [])
    setLoading(false)
  }

  if (loading) return <Spinner />

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)

  return (
    <div>
      <PageTitle>Invii degli studenti</PageTitle>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['all', 'pending', 'graded'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.35rem 0.9rem', borderRadius: 8, border: '1px solid var(--border)',
            background: filter === f ? 'var(--accent)' : 'var(--surface2)',
            color: filter === f ? 'white' : 'var(--text-muted)',
            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne'
          }}>
            {{ all: 'Tutti', pending: 'Da valutare', graded: 'Valutati' }[f]}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.82rem', alignSelf: 'center' }}>
          {filtered.length} invii
        </span>
      </div>

      {filtered.length === 0 ? (
        <Empty message="Nessun invio trovato." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map(s => (
            <Card key={s.id} style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.exercise?.title ?? '—'}</span>
                    {s.exercise?.difficulty && <Badge variant={s.exercise.difficulty}>{s.exercise.difficulty.toUpperCase()}</Badge>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    👤 {s.student?.full_name ?? '—'} · {new Date(s.submitted_at).toLocaleString('it')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  {s.status === 'graded' && s.grade?.total_score != null && (
                    <span style={{
                      fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '1rem',
                      color: 'var(--green)'
                    }}>{s.grade.total_score} pt</span>
                  )}
                  <Badge variant={s.status}>{s.status === 'graded' ? 'VALUTATO' : 'DA VALUTARE'}</Badge>
                  <Link to={`/admin/submissions/${s.id}/grade`}>
                    <Btn size="sm" variant={s.status === 'graded' ? 'ghost' : 'primary'}>
                      {s.status === 'graded' ? '👁 Vedi' : '✏️ Valuta'}
                    </Btn>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
