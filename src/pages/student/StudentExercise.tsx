import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Criterion } from '@/types'
import { PageTitle, Card, Btn, Spinner } from '@/components/shared/ui'

export default function StudentExercise() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [exercise, setExercise] = useState<any>(null)
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [mainCode, setMainCode] = useState('fun main() {\n    // scrivi qui il codice\n}\n')
  const [testCode, setTestCode] = useState('import org.junit.Test\nimport org.junit.Assert.*\n\nclass MainTest {\n    @Test\n    fun testExample() {\n        // scrivi i tuoi test\n    }\n}\n')
  const [activeTab, setActiveTab] = useState<'main' | 'test'>('main')
  const [submission, setSubmission] = useState<any>(null)
  const [grade, setGrade] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: ex } = await supabase
        .from('exercises')
        .select('*, criteria(*)')
        .eq('id', id!)
        .single()
      if (!ex) { setLoading(false); return }
      setExercise(ex)
      setCriteria((ex.criteria ?? []).sort((a: Criterion, b: Criterion) => a.order - b.order))

      const { data: sub } = await supabase
        .from('submissions')
        .select('*, grade:grades(*, criterion_grades(*, criterion:criteria(*)))')
        .eq('exercise_id', id!)
        .eq('student_id', user!.id)
        .maybeSingle()

      if (sub) {
        setSubmission(sub)
        setMainCode(sub.main_code)
        setTestCode(sub.test_code)
        if (sub.grade) setGrade(sub.grade)
      }
      setLoading(false)
    }
    load()
  }, [id, user])

  async function handleSubmit() {
    if (!mainCode.trim()) { alert('Il codice main non può essere vuoto.'); return }
    setSubmitting(true)
    try {
      if (submission) {
        await supabase.from('submissions').update({
          main_code: mainCode, test_code: testCode,
          status: 'pending', submitted_at: new Date().toISOString()
        }).eq('id', submission.id)
      } else {
        await supabase.from('submissions').insert({
          exercise_id: id!, student_id: user!.id,
          main_code: mainCode, test_code: testCode, status: 'pending'
        })
      }
      navigate('/student')
    } catch (err: any) {
      alert('Errore: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />
  if (!exercise) return <div style={{ color: 'var(--red)', padding: '2rem' }}>Esercizio non trovato.</div>

  const totalMax = criteria.reduce((s, c) => s + c.max_points, 0)
  const isGraded = submission?.status === 'graded'

  return (
    <div>
      <button onClick={() => navigate('/student')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem' }}>← Torna agli esercizi</button>
      <PageTitle>{exercise.title}</PageTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Editor */}
        <div>
          {exercise.description && (
            <Card style={{ padding: '1rem', marginBottom: '1rem', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>
                {exercise.description}
              </div>
            </Card>
          )}

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
              height="450px"
              language="kotlin"
              theme="vs-dark"
              value={activeTab === 'main' ? mainCode : testCode}
              onChange={v => { if (isGraded) return; activeTab === 'main' ? setMainCode(v ?? '') : setTestCode(v ?? '') }}
              options={{
                readOnly: isGraded,
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
              }}
            />
          </Card>

          {!isGraded && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => navigate('/student')}>Annulla</Btn>
              <Btn onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Invio...' : submission ? '🔄 Aggiorna invio' : '📤 Invia codice'}
              </Btn>
            </div>
          )}
        </div>

        {/* Right panel: criteria + grade */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: 80 }}>
          {criteria.length > 0 && (
            <Card style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-dim)' }}>
                ⭐ Criteri di valutazione
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {criteria.map(c => {
                  const cg = grade?.criterion_grades?.find((cg: any) => cg.criterion_id === c.id)
                  return (
                    <div key={c.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.5rem 0.75rem', background: 'var(--surface2)',
                      borderRadius: 8, fontSize: '0.82rem'
                    }}>
                      <span>{c.label}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                        {isGraded && cg != null
                          ? <span style={{ color: cg.points === c.max_points ? 'var(--green)' : 'var(--accent)' }}>{cg.points}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>
                        }
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/{c.max_points}</span>
                      </span>
                    </div>
                  )
                })}
                {isGraded && grade && (
                  <div style={{
                    borderTop: '1px solid var(--border)', paddingTop: '0.6rem', marginTop: '0.25rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 700 }}>Totale</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>
                      {grade.total_score}<span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>/{totalMax}</span>
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {isGraded && grade?.comment && (
            <Card style={{ padding: '1.25rem', borderLeft: '3px solid var(--green)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--green)' }}>
                💬 Feedback del docente
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                {grade.comment}
              </p>
            </Card>
          )}

          {isGraded && (
            <div style={{
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--green)'
            }}>
              ✅ Questo esercizio è stato valutato. Il codice è in sola lettura.
            </div>
          )}

          {!submission && (
            <div style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)'
            }}>
              💡 Scrivi il codice nell'editor e clicca <strong>"Invia codice"</strong> quando sei pronto.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
