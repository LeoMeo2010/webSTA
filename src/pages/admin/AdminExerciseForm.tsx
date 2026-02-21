import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Criterion } from '@/types'
import { PageTitle, Card, Btn, Input, Textarea, Select } from '@/components/shared/ui'

interface CriterionDraft {
  id?: string          // present if already in DB
  label: string
  max_points: number
  order: number
}

export default function AdminExerciseForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [deadline, setDeadline] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [criteria, setCriteria] = useState<CriterionDraft[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load existing exercise for editing
  useEffect(() => {
    if (!isEdit) return
    supabase
      .from('exercises')
      .select('*, criteria(*)') 
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setTitle(data.title)
        setDescription(data.description)
        setDifficulty(data.difficulty)
        setDeadline(data.deadline ? data.deadline.slice(0, 16) : '')
        setIsPublished(data.is_published)
        setCriteria((data.criteria ?? []).sort((a: Criterion, b: Criterion) => a.order - b.order))
        setLoading(false)
      })
  }, [id, isEdit])

  // ── Criteria helpers ──────────────────────────────────────────────────────
  function addCriterion() {
    setCriteria(prev => [
      ...prev,
      { label: '', max_points: 5, order: prev.length }
    ])
  }

  function removeCriterion(index: number) {
    setCriteria(prev => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, order: i })))
  }

  function updateCriterion(index: number, field: 'label' | 'max_points', value: string | number) {
    setCriteria(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const totalPoints = criteria.reduce((sum, c) => sum + Number(c.max_points), 0)

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!title.trim()) { setError('Il titolo è obbligatorio.'); return }
    if (criteria.some(c => !c.label.trim())) { setError('Tutti i criteri devono avere un nome.'); return }
    setError('')
    setSaving(true)

    try {
      let exerciseId = id

      const payload = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        is_published: isPublished,
        created_by: user!.id,
      }

      if (isEdit) {
        const { error: err } = await supabase.from('exercises').update(payload).eq('id', id!)
        if (err) throw err
      } else {
        const { data, error: err } = await supabase.from('exercises').insert(payload).select().single()
        if (err) throw err
        exerciseId = data.id
      }

      // Delete existing criteria and re-insert (simplest approach)
      await supabase.from('criteria').delete().eq('exercise_id', exerciseId!)

      if (criteria.length > 0) {
        const { error: cErr } = await supabase.from('criteria').insert(
          criteria.map((c, i) => ({
            exercise_id: exerciseId!,
            label: c.label.trim(),
            max_points: Number(c.max_points),
            order: i,
          }))
        )
        if (cErr) throw cErr
      }

      navigate('/admin/exercises')
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Caricamento...</div>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <PageTitle>{isEdit ? 'Modifica esercizio' : 'Nuovo esercizio'}</PageTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Base info */}
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-dim)' }}>📋 Informazioni base</h2>
          <Input label="Titolo *" value={title} onChange={e => setTitle(e.target.value)} placeholder="es. FizzBuzz con Sequenze" />
          <Textarea label="Descrizione" value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Descrivi l'esercizio, le istruzioni e gli obiettivi..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select label="Difficoltà" value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
              <option value="easy">🟢 Facile</option>
              <option value="medium">🟡 Medio</option>
              <option value="hard">🔴 Difficile</option>
            </Select>
            <Input label="Scadenza (opzionale)" type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
            <span>Pubblica subito (visibile agli studenti)</span>
          </label>
        </Card>

        {/* Criteria */}
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-dim)' }}>⭐ Criteri di valutazione</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Definisci i criteri con i punti massimi per ciascuno.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {criteria.length > 0 && (
                <div style={{
                  fontFamily: 'JetBrains Mono', fontSize: '0.85rem', fontWeight: 700,
                  color: totalPoints === 30 ? 'var(--green)' : totalPoints > 30 ? 'var(--red)' : 'var(--accent2)',
                  background: 'var(--surface2)', padding: '0.3rem 0.75rem', borderRadius: 8,
                  border: `1px solid ${totalPoints === 30 ? 'rgba(34,197,94,0.3)' : totalPoints > 30 ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}`
                }}>
                  TOT: {totalPoints} pt
                </div>
              )}
              <Btn size="sm" onClick={addCriterion}>+ Aggiungi criterio</Btn>
            </div>
          </div>

          {criteria.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '2rem', border: '2px dashed var(--border)',
              borderRadius: 10, color: 'var(--text-muted)', fontSize: '0.85rem'
            }}>
              Nessun criterio. Clicca <strong>+ Aggiungi criterio</strong> per iniziare.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {/* Header row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 110px 36px',
                gap: '0.75rem', padding: '0 0.25rem',
                fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700
              }}>
                <span>CRITERIO</span>
                <span>PUNTI MAX</span>
                <span />
              </div>
              {criteria.map((c, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 110px 36px',
                  gap: '0.75rem', alignItems: 'center',
                  background: 'var(--surface2)', padding: '0.6rem 0.75rem',
                  borderRadius: 8, border: '1px solid var(--border)'
                }}>
                  <input
                    value={c.label}
                    onChange={e => updateCriterion(i, 'label', e.target.value)}
                    placeholder={`Criterio ${i + 1} (es. Correttezza logica)`}
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--text)',
                      fontSize: '0.85rem', fontFamily: 'Syne, sans-serif', outline: 'none', width: '100%'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="number"
                      min={1} max={30}
                      value={c.max_points}
                      onChange={e => updateCriterion(i, 'max_points', parseInt(e.target.value) || 1)}
                      style={{
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '0.3rem 0.5rem', width: 60,
                        color: 'var(--accent)', fontFamily: 'JetBrains Mono', fontWeight: 700,
                        fontSize: '0.9rem', textAlign: 'center', outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>pt</span>
                  </div>
                  <button
                    onClick={() => removeCriterion(i)}
                    style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      color: 'var(--red)', borderRadius: 6, width: 32, height: 32, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem'
                    }}
                  >✕</button>
                </div>
              ))}

              {/* Summary row */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', padding: '0.5rem 0.25rem',
                fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)',
                marginTop: '0.25rem'
              }}>
                Totale punti: <strong style={{
                  marginLeft: '0.4rem',
                  color: totalPoints === 30 ? 'var(--green)' : totalPoints > 30 ? 'var(--red)' : 'var(--text)'
                }}>{totalPoints}</strong>
                {totalPoints > 30 && <span style={{ color: 'var(--red)', marginLeft: '0.4rem' }}>⚠ supera 30!</span>}
              </div>
            </div>
          )}
        </Card>

        {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => navigate('/admin/exercises')}>Annulla</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio...' : isEdit ? '💾 Salva modifiche' : '✅ Crea esercizio'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
