import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Exercise } from '@/types'
import { PageTitle, Card, Btn, Badge, Spinner, Empty } from '@/components/shared/ui'

export default function AdminExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchExercises() }, [])

  async function fetchExercises() {
    const { data } = await supabase
      .from('exercises')
      .select('*, criteria(*)') 
      .order('created_at', { ascending: false })
    setExercises(data ?? [])
    setLoading(false)
  }

  async function togglePublish(ex: Exercise) {
    await supabase.from('exercises').update({ is_published: !ex.is_published }).eq('id', ex.id)
    setExercises(prev => prev.map(e => e.id === ex.id ? { ...e, is_published: !e.is_published } : e))
  }

  async function deleteExercise(id: string) {
    if (!confirm('Eliminare questo esercizio? Verranno eliminati anche tutti gli invii.')) return
    await supabase.from('exercises').delete().eq('id', id)
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <PageTitle>Esercizi</PageTitle>
        <Link to="/admin/exercises/new"><Btn>+ Nuovo esercizio</Btn></Link>
      </div>

      {exercises.length === 0
        ? <Empty message="Nessun esercizio ancora. Creane uno!" />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {exercises.map(ex => (
              <Card key={ex.id} style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700 }}>{ex.title}</span>
                    <Badge variant={ex.difficulty}>{ex.difficulty.toUpperCase()}</Badge>
                    {ex.is_published
                      ? <Badge variant="open">PUBBLICATO</Badge>
                      : <Badge variant="pending">BOZZA</Badge>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {ex.criteria?.length ?? 0} criteri · {ex.deadline ? `Scadenza: ${new Date(ex.deadline).toLocaleDateString('it')}` : 'Nessuna scadenza'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <Btn size="sm" variant="ghost" onClick={() => togglePublish(ex)}>
                    {ex.is_published ? '🔒 Nascondi' : '🌐 Pubblica'}
                  </Btn>
                  <Link to={`/admin/exercises/${ex.id}/edit`}><Btn size="sm" variant="ghost">✏️ Modifica</Btn></Link>
                  <Btn size="sm" variant="danger" onClick={() => deleteExercise(ex.id)}>🗑</Btn>
                </div>
              </Card>
            ))}
          </div>
        )
      }
    </div>
  )
}
