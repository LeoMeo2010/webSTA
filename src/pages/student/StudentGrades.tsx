import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageTitle, Card, Badge, Spinner, Empty } from '@/components/shared/ui'

export default function StudentGrades() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('submissions')
      .select('id, status, submitted_at, exercise:exercises(id, title, difficulty, criteria(id, max_points)), grade:grades(total_score, comment, graded_at, criterion_grades(points, criterion:criteria(label, max_points)))')
      .eq('student_id', user.id)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => { setSubmissions(data ?? []); setLoading(false) })
  }, [user])

  if (loading) return <Spinner />

  const graded = submissions.filter(s => s.status === 'graded')
  const pending = submissions.filter(s => s.status === 'pending')

  return (
    <div>
      <PageTitle>I miei voti</PageTitle>

      {submissions.length === 0 ? (
        <Empty message="Non hai ancora inviato nessun esercizio." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pending.length > 0 && (
            <div>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                In attesa di valutazione ({pending.length})
              </h2>
              {pending.map(s => (
                <Card key={s.id} style={{ padding: '1rem 1.25rem', marginBottom: '0.5rem', opacity: 0.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{s.exercise?.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Inviato: {new Date(s.submitted_at).toLocaleDateString('it')}
                      </div>
                    </div>
                    <Badge variant="pending">IN ATTESA</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {graded.length > 0 && (
            <div>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Valutati ({graded.length})
              </h2>
              {graded.map(s => {
                const totalMax = (s.exercise?.criteria ?? []).reduce((sum: number, c: any) => sum + c.max_points, 0)
                const score = s.grade?.total_score ?? 0
                const pct = totalMax > 0 ? Math.round((score / totalMax) * 100) : 0
                return (
                  <Card key={s.id} style={{ padding: '1.25rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{s.exercise?.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {s.exercise?.difficulty && <><Badge variant={s.exercise.difficulty}>{s.exercise.difficulty.toUpperCase()}</Badge>&nbsp;</>}
                          Valutato: {new Date(s.grade?.graded_at).toLocaleDateString('it')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono', color: 'var(--green)' }}>
                          {score}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{totalMax}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pct}%</div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.75rem' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, transition: 'width 0.5s',
                        width: `${pct}%`,
                        background: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--accent2)'
                      }} />
                    </div>

                    {/* Criterion breakdown */}
                    {s.grade?.criterion_grades?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                        {s.grade.criterion_grades.map((cg: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            <span>{cg.criterion?.label}</span>
                            <span style={{ fontFamily: 'JetBrains Mono', color: cg.points === cg.criterion?.max_points ? 'var(--green)' : 'var(--text-dim)' }}>
                              {cg.points}/{cg.criterion?.max_points}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {s.grade?.comment && (
                      <div style={{
                        background: 'var(--surface2)', borderRadius: 8, padding: '0.65rem 0.85rem',
                        fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.6,
                        borderLeft: '3px solid var(--green)'
                      }}>
                        💬 {s.grade.comment}
                      </div>
                    )}

                    <div style={{ marginTop: '0.75rem' }}>
                      <Link to={`/student/exercises/${s.exercise?.id}`} style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none' }}>
                        Vedi codice →
                      </Link>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
