import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Exercise } from '@/types'
import { PageTitle, Card, Badge, Btn, Spinner, Empty } from '@/components/shared/ui'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<(Exercise & { mySubmission?: any })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data: exs }, { data: subs }] = await Promise.all([
        supabase.from('exercises').select('*, criteria(id, max_points)').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('submissions').select('id, status, exercise_id, grade:grades(total_score)').eq('student_id', user!.id),
      ])
      const subMap = Object.fromEntries((subs ?? []).map(s => [s.exercise_id, s]))
      setExercises((exs ?? []).map(ex => ({ ...ex, mySubmission: subMap[ex.id] })))
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <Spinner />

  return (
    <div>
      <PageTitle>Esercizi disponibili</PageTitle>

      {exercises.length === 0 ? (
        <Empty message="Nessun esercizio pubblicato al momento." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {exercises.map(ex => {
            const sub = ex.mySubmission
            const totalMax = (ex.criteria ?? []).reduce((s: number, c: any) => s + c.max_points, 0)
            return (
              <Card key={ex.id} style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700 }}>{ex.title}</span>
                    <Badge variant={ex.difficulty}>{ex.difficulty.toUpperCase()}</Badge>
                    {totalMax > 0 && (
                      <span style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                        {totalMax} pt totali
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {ex.deadline ? `Scadenza: ${new Date(ex.deadline).toLocaleDateString('it')}` : 'Nessuna scadenza'}
                    {(ex.criteria?.length ?? 0) > 0 && ` · ${ex.criteria!.length} criteri`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  {sub?.status === 'graded' && sub.grade?.total_score != null && (
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--green)' }}>
                      {sub.grade.total_score}/{totalMax} pt
                    </span>
                  )}
                  {sub
                    ? <Badge variant={sub.status}>{sub.status === 'graded' ? 'VALUTATO' : 'CONSEGNATO'}</Badge>
                    : <Badge variant="open">APERTO</Badge>
                  }
                  <Link to={`/student/exercises/${ex.id}`}>
                    <Btn size="sm" variant={sub ? 'ghost' : 'primary'}>
                      {sub ? '👁 Vedi' : '✏️ Svolgi'}
                    </Btn>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
