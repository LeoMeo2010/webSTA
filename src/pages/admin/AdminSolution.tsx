import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { supabase } from '@/lib/supabase'
import { PageTitle, Card, Btn, Spinner } from '@/components/shared/ui'

export default function AdminSolution() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [exercise, setExercise] = useState<any>(null)
  const [solutionCode, setSolutionCode] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase
      .from('exercises')
      .select('id, title, solution_code, solution_published')
      .eq('id', id!)
      .single()
      .then(({ data }) => {
        if (!data) return
        setExercise(data)
        setSolutionCode(data.solution_code ?? '// Scrivi qui la soluzione\nfun main() {\n\n}\n')
        setPublished(data.solution_published ?? false)
        setLoading(false)
      })
  }, [id])

  async function handleSave(publish?: boolean) {
    setSaving(true)
    setMsg('')
    const newPublished = publish !== undefined ? publish : published
    const { error } = await supabase
      .from('exercises')
      .update({
        solution_code: solutionCode,
        solution_published: newPublished,
      })
      .eq('id', id!)
    setSaving(false)
    if (error) {
      setMsg('❌ Errore: ' + error.message)
    } else {
      setPublished(newPublished)
      setMsg(newPublished ? '✅ Soluzione salvata e pubblicata!' : '✅ Soluzione salvata come bozza.')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  if (loading) return <Spinner />
  if (!exercise) return <div style={{ color: 'var(--red)', padding: '2rem' }}>Esercizio non trovato.</div>

  return (
    <div>
      <button onClick={() => navigate('/admin/exercises')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        ← Torna agli esercizi
      </button>
      <PageTitle>Soluzione — {exercise.title}</PageTitle>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{
          padding: '0.4rem 0.9rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
          background: published ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.1)',
          color: published ? 'var(--green)' : '#eab308',
          border: `1px solid ${published ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`
        }}>
          {published ? '🌐 Pubblicata — visibile agli studenti' : '🔒 Bozza — non visibile agli studenti'}
        </div>
        {msg && <span style={{ fontSize: '0.82rem', color: 'var(--green)' }}>{msg}</span>}
      </div>

      <Card style={{ overflow: 'hidden', marginBottom: '1rem' }}>
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.82rem', color: 'var(--accent)' }}>📄 Solution.kt</span>
        </div>
        <Editor
          height="500px"
          language="kotlin"
          theme="vs-dark"
          value={solutionCode}
          onChange={v => setSolutionCode(v ?? '')}
          options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on' }}
        />
      </Card>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Btn onClick={() => handleSave(false)} disabled={saving} variant="ghost">
          💾 Salva come bozza
        </Btn>
        <Btn onClick={() => handleSave(true)} disabled={saving}>
          {published ? '🔄 Aggiorna e mantieni pubblica' : '🌐 Salva e pubblica'}
        </Btn>
        {published && (
          <Btn onClick={() => handleSave(false)} disabled={saving} variant="danger">
            🔒 Nascondi agli studenti
          </Btn>
        )}
      </div>
    </div>
  )
}
