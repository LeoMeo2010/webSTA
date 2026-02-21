import React from 'react'

// ── Button ──────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'orange'
  size?: 'sm' | 'md'
}
export function Btn({ variant = 'primary', size = 'md', style, children, ...props }: BtnProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 700, cursor: 'pointer',
    border: 'none', transition: 'all 0.15s',
    padding: size === 'sm' ? '0.3rem 0.75rem' : '0.55rem 1.1rem',
    fontSize: size === 'sm' ? '0.75rem' : '0.85rem',
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: 'white' },
    ghost: { background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border)' },
    danger: { background: 'rgba(239,68,68,0.15)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' },
    orange: { background: 'var(--accent2)', color: 'white' },
  }
  return <button style={{ ...base, ...variants[variant], ...style }} {...props}>{children}</button>
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, ...style
    }} {...props}>
      {children}
    </div>
  )
}

// ── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string }
export function Input({ label, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {label && <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>{label}</label>}
      <input style={{
        background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '0.55rem 0.8rem', color: 'var(--text)', fontSize: '0.88rem',
        fontFamily: 'Syne, sans-serif', outline: 'none', width: '100%', ...style
      }} {...props} />
    </div>
  )
}

// ── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string }
export function Textarea({ label, style, ...props }: TextareaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {label && <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>{label}</label>}
      <textarea style={{
        background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '0.55rem 0.8rem', color: 'var(--text)', fontSize: '0.88rem',
        fontFamily: 'Syne, sans-serif', outline: 'none', width: '100%', resize: 'vertical', ...style
      }} {...props} />
    </div>
  )
}

// ── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string }
export function Select({ label, style, children, ...props }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {label && <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>{label}</label>}
      <select style={{
        background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '0.55rem 0.8rem', color: 'var(--text)', fontSize: '0.88rem',
        fontFamily: 'Syne, sans-serif', outline: 'none', width: '100%', ...style
      }} {...props}>
        {children}
      </select>
    </div>
  )
}

// ── Badge ────────────────────────────────────────────────────────────────────
const badgeStyles: Record<string, React.CSSProperties> = {
  pending: { background: 'rgba(234,179,8,0.12)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' },
  graded:  { background: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' },
  open:    { background: 'rgba(124,106,247,0.12)', color: '#7c6af7', border: '1px solid rgba(124,106,247,0.3)' },
  easy:    { background: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' },
  medium:  { background: 'rgba(234,179,8,0.12)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' },
  hard:    { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
}
export function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  return (
    <span style={{
      padding: '0.2rem 0.6rem', borderRadius: 20,
      fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
      ...(badgeStyles[variant] ?? badgeStyles.open)
    }}>{children}</span>
  )
}

// ── Page title ───────────────────────────────────────────────────────────────
export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem',
      display: 'flex', alignItems: 'center', gap: '0.6rem'
    }}>
      <span style={{ display: 'block', width: 4, height: '1.5rem', background: 'var(--accent)', borderRadius: 2, minWidth: 4 }} />
      {children}
    </h1>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      Caricamento...
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      {message}
    </div>
  )
}
