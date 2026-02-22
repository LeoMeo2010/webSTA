import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageTitle, Card, Spinner } from '@/components/shared/ui'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender?: { full_name: string }
}

export default function AdminChat() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    const { data } = await supabase
      .from('admin_messages')
      .select('*, sender:profiles(full_name)')
      .order('created_at', { ascending: true })
      .limit(200)
    setMessages(data ?? [])
    setLoading(false)
  }

  async function sendMessage() {
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    const { data, error } = await supabase
      .from('admin_messages')
      .insert({ content, sender_id: profile!.id })
      .select('*, sender:profiles(full_name)')
      .single()
    if (!error && data) {
      setMessages(prev => [...prev, data])
    }
    setSending(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function deleteMessage(id: string) {
    await supabase.from('admin_messages').delete().eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    if (isToday) return d.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('it', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' })
  }

  // Group messages by sender in sequence
  function isNewGroup(i: number) {
    if (i === 0) return true
    return messages[i].sender_id !== messages[i - 1].sender_id
  }

  if (loading) return <Spinner />

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <PageTitle>💬 Chat Admin</PageTitle>
        <button onClick={fetchMessages} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem 0.8rem',
          fontSize: '0.78rem', fontFamily: 'Syne', fontWeight: 600
        }}>🔄 Aggiorna</button>
      </div>

      <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages area */}
        <div style={{
          height: 480, overflowY: 'auto', padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '0.15rem'
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2rem' }}>
              Nessun messaggio ancora. Inizia la conversazione!
            </div>
          )}

          {messages.map((m, i) => {
            const isMine = m.sender_id === profile?.id
            const newGroup = isNewGroup(i)

            return (
              <div key={m.id} style={{
                display: 'flex',
                flexDirection: isMine ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: '0.5rem',
                marginTop: newGroup ? '0.75rem' : '0.1rem',
              }}>
                {/* Avatar — solo primo messaggio del gruppo */}
                <div style={{ width: 28, flexShrink: 0 }}>
                  {newGroup && !isMine && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(124,106,247,0.2)',
                      border: '1px solid rgba(124,106,247,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)'
                    }}>
                      {((m.sender as any)?.full_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  {/* Name + time — solo primo messaggio del gruppo */}
                  {newGroup && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontFamily: 'JetBrains Mono' }}>
                      {isMine ? 'Tu' : (m.sender as any)?.full_name ?? 'Admin'} · {formatTime(m.created_at)}
                    </div>
                  )}

                  {/* Bubble */}
                  <div style={{ position: 'relative' }} className="msg-bubble">
                    <div style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isMine ? 'var(--accent)' : 'var(--surface2)',
                      color: isMine ? 'white' : 'var(--text)',
                      fontSize: '0.875rem', lineHeight: 1.5,
                      border: isMine ? 'none' : '1px solid var(--border)',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                    }}>
                      {m.content}
                    </div>

                    {/* Delete button (proprio messaggio o admin) */}
                    <button
                      onClick={() => deleteMessage(m.id)}
                      style={{
                        position: 'absolute', top: -6, right: isMine ? 'auto' : -6, left: isMine ? -6 : 'auto',
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'var(--red)', border: 'none', cursor: 'pointer',
                        color: 'white', fontSize: '0.55rem', display: 'none',
                        alignItems: 'center', justifyContent: 'center', lineHeight: 1
                      }}
                      className="delete-btn"
                      title="Elimina"
                    >✕</button>
                  </div>

                  {/* Time per messaggi successivi dello stesso gruppo */}
                  {!newGroup && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.1rem', fontFamily: 'JetBrains Mono' }}>
                      {formatTime(m.created_at)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio... (Invio per inviare, Shift+Invio per andare a capo)"
            rows={1}
            style={{
              flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.6rem 0.85rem', color: 'var(--text)',
              fontSize: '0.875rem', fontFamily: 'Syne', outline: 'none', resize: 'none',
              lineHeight: 1.5, maxHeight: 120, overflowY: 'auto'
            }}
            onInput={e => {
              const el = e.target as HTMLTextAreaElement
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: text.trim() ? 'var(--accent)' : 'var(--border)',
              color: 'white', cursor: text.trim() ? 'pointer' : 'not-allowed',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.15s'
            }}
          >
            {sending ? '⏳' : '↑'}
          </button>
        </div>
      </Card>

      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
        Questa chat è visibile solo agli amministratori. Clicca 🔄 per aggiornare i messaggi.
      </p>

      <style>{`
        .msg-bubble:hover .delete-btn { display: flex !important; }
      `}</style>
    </div>
  )
}
