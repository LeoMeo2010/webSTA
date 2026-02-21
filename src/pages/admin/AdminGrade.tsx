import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Criterion } from '@/types'
import { PageTitle, Card, Btn, Textarea, Spinner } from '@/components/shared/ui'

interface CriterionScore { criterion: Criterion; points: number }

export default function AdminGrade() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [submission, setSubmission] = useState<any>(null)
  const [criterionScores, setCriterionScores] = useState<CriterionScore[]>([])
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'main' | 'test'>('main')
  const [existingGradeId, setExistingGradeId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      // Load submission + exercise + criteria
      const { data: sub } = await supabase
        .from('submissions')
        .select('*, student:profiles(full_name, id), exercise:exercises(*, criteria(*))')
        .eq('id', id!)
        .single()

      if (!sub) { setLoading(false); return }
      setSubmission(sub)

      const rawCriteria: Criterion[] = (sub.exercise?.criteria ?? []).sort((a: Criterion, b: Criterion) => a.order - b.order)

      // Load existing grade if any
      const { data: grade } = await supabase
        .from('grades')
        .select('*, criterion_grades(*)')
        .eq('submission_id', id!)
        .maybeSingle()

      if (grade) {
        setExistingGradeId(grade.id)
        setComment(grade.comment ?? '')
        setCriterionScores(rawCriteria.map(cr => {
          const existing = grade.criterion_grades.find((cg: any) => cg.criterion_id === cr.id)
          return { criterion: cr, points: existing?.points ?? 0 }
        }))
      } else {
        setCriterionScores(rawCriteria.map(cr => ({ criterion: cr, points: 0 })))
      }

      setLoading(false)
    }
    load()
  }, [id])

  function setPoints(criterionId: string, value: number) {
    setCriterionScores(prev => prev.map(cs =>
      cs.criterion.id === criterionId
        ? { ...cs, points: Math.min(cs.criterion.max_points, Math.max(0, value)) }
        : cs
    ))
  }

  const totalScore = criterionScores.reduce((sum, cs) => sum + cs.points, 0)
  const maxTotal = criterionScores.reduce((sum, cs) => sum + cs.criterion.max_points, 0)

  async function handleSave() {
    setSaving(true)
    try {
      let gradeId = existingGradeId

      if (gradeId) {
        await supabase.from('grades').update({
          total_score: totalScore,
          comment,
          graded_by: user!.id,
          graded_at: new Date().toISOString(),
        }).eq('id', gradeId)
        // Delete and re-insert criterion grades
        await supabase.from('criterion_grades').delete().eq('grade_id', gradeId)
      } else {
        const { data: g } = await supabase.from('grades').insert({
          submission_id: id!,
          graded_by: user!.id,
          total_score: totalScore,
          comment,
        }).select().single()
        gradeId = g.id
        setExistingGradeId(gradeId)
      }

      if (criterionScores.length > 0) {
        await supabase.from('criterion_grades').insert(
          criterionScores.map(cs => ({
            grade_id: gradeId!,
            criterion_id: cs.criterion.id,
            points: cs.points,
          }))
        )
      }

      // Mark submission as graded
      await supabase.from('submissions').update({ status: 'graded' }).eq('id', id!)

      navigate('/admin/submissions')
    } catch (err: any) {
      alert('Errore: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (!submission) return <div style={{ color: 'var(--red)', padding: '2rem' }}>Invio non trovato.</div>

  const exercise = submission.exercise

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>← Indietro</button>
      </div>
      <PageTitle>Valuta invio</PageTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Code */}
        <div>
          <Card style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{exercise?.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Studente: <strong style={{ color: 'var(--text)' }}>{submission.student?.full_name}</strong>
                &nbsp;·&nbsp;Inviato: {new Date(submission.submitted_at).toLocaleString('it')}
              </div>
            </div>
            {exercise?.description && (
              <div style={{
                background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem',
                fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.6,
                borderLeft: '3px solid var(--accent)'
              }}>
                {exercise.description}
              </div>
            )}
          </Card>

          <Card style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {(['main', 'test'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '0.6rem 1.25rem', background: 'none', border: 'none',
                  borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'JetBrains Mono',
                  marginBottom: -1
                }}>
                  {tab === 'main' ? '📄 Main.kt' : '🧪 MainTest.kt'}
                </button>
              ))}
            </div>
            <Editor
              height="420px"
              language="kotlin"
              theme="vs-dark"
              value={activeTab === 'main' ? submission.main_code : submission.test_code}
              options={{ readOnly: true, fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false }}
            />
          </Card>
        </div>

        {/* Right: Grading panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: 80 }}>
          <Card style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-dim)' }}>
              ⭐ Criteri di valutazione
            </h3>

            {criterionScores.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Nessun criterio definito per questo esercizio.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {criterionScores.map(cs => (
                  <div key={cs.criterion.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{cs.criterion.label}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                        max {cs.criterion.max_points} pt
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {/* Slider */}
                      <input
                        type="range"
                        min={0} max={cs.criterion.max_points}
                        value={cs.points}
                        onChange={e => setPoints(cs.criterion.id, parseInt(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      {/* Number input */}
                      <input
                        type="number"
                        min={0} max={cs.criterion.max_points}
                        value={cs.points}
                        onChange={e => setPoints(cs.criterion.id, parseInt(e.target.value) || 0)}
                        style={{
                          width: 48, background: 'var(--surface2)', border: '1px solid var(--border)',
                          borderRadius: 6, padding: '0.25rem 0.4rem', textAlign: 'center',
                          color: 'var(--accent)', fontFamily: 'JetBrains Mono', fontWeight: 700,
                          fontSize: '0.88rem', outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 20, fontFamily: 'JetBrains Mono' }}>
                        /{cs.criterion.max_points}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: '0.3rem', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${(cs.points / cs.criterion.max_points) * 100}%`,
                        background: cs.points === cs.criterion.max_points
                          ? 'var(--green)' : cs.points > 0 ? 'var(--accent)' : 'transparent',
                        transition: 'width 0.2s'
                      }} />
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div style={{
                  borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Punteggio totale</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{
                      fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono',
                      color: totalScore === maxTotal ? 'var(--green)' : totalScore > 0 ? 'var(--accent)' : 'var(--text-muted)'
                    }}>{totalScore}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>/{maxTotal}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card style={{ padding: '1.25rem' }}>
            <Textarea
              label="💬 Commento per lo studente"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="Scrivi un feedback dettagliato..."
            />
          </Card>

          <Btn onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
            {saving ? 'Salvataggio...' : existingGradeId ? '💾 Aggiorna valutazione' : '✅ Salva valutazione'}
          </Btn>
          <Btn variant="ghost" onClick={() => navigate(-1)} style={{ width: '100%' }}>Annulla</Btn>
        </div>
      </div>
    </div>
  )
}
