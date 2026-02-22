import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageTitle, Card, Btn, Input, Textarea, Spinner, Empty } from '@/components/shared/ui'

interface Announcement {
  id: string
  title: string
  content: string
  pinned: boolean
  created_at: string
  created_by: string
  author?: { full_name: string }
}

export default function AnnouncementsPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => { fetchAnnouncements() }, [])

  async function fetchAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*, author:profiles(full_name)')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
    setLoading(false)
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id)
    setTitle(a.title)
    setContent(a.content)
    setPinned(a.pinned)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setContent('')
    setPinned(false)
    setShowForm(false)
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    if (editingId) {
      await supabase.from('announcements').update({
        title: title.trim(), content: content.trim(), pinned,
        updated_at: new Date().toISOString()
      }).eq('id', editingId)
    } else {
      await supabase.from('announcements').insert({
        title: title.trim(), content: content.trim(), pinned,
        created_by: profile!.id
      })
    }
    setSaving(false)
    resetForm()
    fetchAnnouncements()
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo annuncio?')) return
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  async function togglePin(a: Announcement) {
    await supabase.from('announcements').update({ pinned: !a.pinned }).eq('id', a.id)
    setAnnouncements(prev => prev.map(x => x.id === a.id ? { ...x, pinned: !x.pinned } : x)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <PageTitle>📢 Bacheca</PageTitle>
        {isAdmin && !showForm && (
          <Btn onClick={() => setShowForm(true)}>+ Nuovo annuncio</Btn>
        )}
      </div>

      {/* Form (admin only) */}
      {isAdmin && showForm && (
        <Card style={{ padding: '1.5rem', marginBottom: '1.5rem', borderColor: 'rgba(124,106,247,0.3)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-dim)' }}>
            {editingId ? '✏️ Modifica annuncio' : '➕ Nuovo annuncio'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Titolo *" value={title} onChange={e => setTitle(e.target.value)} placeholder="es. Esame rimandato al 10 marzo" />
            <Textarea label="Contenuto *" value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Scrivi il testo dell'annuncio..." />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
              📌 Fissa in cima alla bacheca
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Btn onClick={handleSave} disabled={saving}>
                {saving ? 'Salvataggio...' : editingId ? '💾 Aggiorna' : '✅ Pubblica'}
              </Btn>
              <Btn variant="ghost" onClick={resetForm}>Annulla</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <Empty message="Nessun annuncio pubblicato." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map(a => (
            <Card key={a.id} style={{
              padding: '1.25rem 1.5rem',
              borderColor: a.pinned ? 'rgba(234,179,8,0.35)' : 'var(--border)',
              background: a.pinned ? 'rgba(234,179,8,0.04)' : 'var(--surface)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    {a.pinned && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#eab308', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', padding: '0.15rem 0.5rem', borderRadius: 20 }}>
                        📌 IN EVIDENZA
                      </span>
                    )}
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{a.title}</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.7, margin: '0 0 0.75rem', whiteSpace: 'pre-wrap' }}>
                    {a.content}
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                    {(a.author as any)?.full_name ?? 'Admin'} · {new Date(a.created_at).toLocaleDateString('it', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <Btn size="sm" variant="ghost" onClick={() => togglePin(a)} title={a.pinned ? 'Rimuovi evidenza' : 'Fissa in cima'}>
                      {a.pinned ? '📌' : '📍'}
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => startEdit(a)}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => handleDelete(a.id)}>🗑</Btn>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
