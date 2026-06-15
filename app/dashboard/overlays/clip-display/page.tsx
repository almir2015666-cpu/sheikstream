'use client'
import { useState, useEffect } from 'react'

const S = {
  bg: '#08090d', card: '#0f1018', cardB: 'rgba(255,255,255,0.06)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.28)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)', primaryB: 'rgba(155,48,255,0.35)',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.1)', greenB: 'rgba(34,197,94,0.3)',
  border: 'rgba(255,255,255,0.07)',
}

const POSITIONS = [
  { value: 'bottom-left',  label: 'Canto inferior esq.' },
  { value: 'bottom-right', label: 'Canto inferior dir.' },
  { value: 'top-left',     label: 'Canto superior esq.' },
  { value: 'top-right',    label: 'Canto superior dir.' },
]
const THEMES = [
  { value: 'dark',   label: 'Escuro' },
  { value: 'glass',  label: 'Vidro' },
  { value: 'purple', label: 'Roxo' },
]
const DURATIONS = [5, 8, 10, 15, 20, 30]
const INTERVALS = [
  { value: 20,  label: '20 seg' },
  { value: 30,  label: '30 seg' },
  { value: 60,  label: '1 min' },
  { value: 120, label: '2 min' },
]

export default function ClipDisplayConfigPage() {
  const [uid,        setUid]        = useState('')
  const [position,   setPosition]   = useState('bottom-left')
  const [theme,      setTheme]      = useState('dark')
  const [duration,   setDuration]   = useState(10)
  const [interval,   setInterval]   = useState(30)
  const [showThumb,  setShowThumb]  = useState(true)
  const [showViews,  setShowViews]  = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(u => { if (u?.id) setUid(u.id) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!uid) return
    fetch(`/api/overlay/clip-display?uid=${uid}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.position  != null) setPosition(d.position)
        if (d.theme     != null) setTheme(d.theme)
        if (d.duration  != null) setDuration(d.duration)
        if (d.interval  != null) setInterval(d.interval)
        if (d.showThumb != null) setShowThumb(d.showThumb)
        if (d.showViews != null) setShowViews(d.showViews)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [uid])

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/overlay/clip-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, theme, duration, interval, showThumb, showViews }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  function copyUrl() {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    navigator.clipboard.writeText(`${base}/overlay/clip-display?uid=${uid}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const obsUrl = uid ? `${typeof window !== 'undefined' ? window.location.origin : ''}/overlay/clip-display?uid=${uid}` : '…'

  const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
  const lbl: React.CSSProperties = { fontSize: '0.68rem', fontWeight: 700, color: S.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }

  function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
    return (
      <button onClick={() => set(!on)} style={{
        width: 40, height: 22, borderRadius: 11, background: on ? S.primary : 'rgba(255,255,255,0.08)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16,
          borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        }} />
      </button>
    )
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', padding: '1.75rem 2rem', fontFamily: "-apple-system,'Inter',sans-serif", color: S.text }}>
      <div style={{ maxWidth: 680 }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={S.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Clip Display</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: S.muted }}>
            Notificação automática quando alguém cria um clipe durante a live.
          </p>
        </div>

        {/* OBS URL */}
        <div style={{ background: S.card, border: `1px solid ${S.primaryB}`, borderRadius: 12, padding: '1rem 1.1rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: S.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>URL do OBS Browser Source</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <code style={{ flex: 1, fontSize: '0.75rem', color: S.muted, wordBreak: 'break-all', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: 6, border: `1px solid ${S.border}` }}>
              {obsUrl}
            </code>
            <button onClick={copyUrl} style={{ padding: '0.45rem 0.85rem', background: copied ? S.greenBg : S.primaryBg, border: `1px solid ${copied ? S.greenB : S.primaryB}`, color: copied ? S.green : S.primary, borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: S.dim }}>
            Recomendado: 400×120 px, sem áudio · OBS → Fontes → Browser Source
          </p>
        </div>

        {/* Config card */}
        <div style={{ background: S.card, border: `1px solid ${S.cardB}`, borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Position */}
          <div style={row}>
            <span style={lbl}>Posição na tela</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              {POSITIONS.map(p => (
                <button key={p.value} onClick={() => setPosition(p.value)} style={{
                  padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${position === p.value ? S.primaryB : S.border}`,
                  background: position === p.value ? S.primaryBg : 'transparent', color: position === p.value ? S.primary : S.muted,
                  fontSize: '0.8rem', fontWeight: position === p.value ? 700 : 400, cursor: 'pointer', textAlign: 'left',
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div style={row}>
            <span style={lbl}>Tema visual</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {THEMES.map(t => (
                <button key={t.value} onClick={() => setTheme(t.value)} style={{
                  flex: 1, padding: '0.45rem', borderRadius: 8, border: `1px solid ${theme === t.value ? S.primaryB : S.border}`,
                  background: theme === t.value ? S.primaryBg : 'transparent', color: theme === t.value ? S.primary : S.muted,
                  fontSize: '0.8rem', fontWeight: theme === t.value ? 700 : 400, cursor: 'pointer',
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div style={row}>
            <span style={lbl}>Tempo de exibição</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {DURATIONS.map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{
                  padding: '0.4rem 0.7rem', borderRadius: 8, border: `1px solid ${duration === d ? S.primaryB : S.border}`,
                  background: duration === d ? S.primaryBg : 'transparent', color: duration === d ? S.primary : S.muted,
                  fontSize: '0.8rem', fontWeight: duration === d ? 700 : 400, cursor: 'pointer',
                }}>
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Poll interval */}
          <div style={row}>
            <span style={lbl}>Verificar novos clipes a cada</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {INTERVALS.map(i => (
                <button key={i.value} onClick={() => setInterval(i.value)} style={{
                  padding: '0.4rem 0.7rem', borderRadius: 8, border: `1px solid ${interval === i.value ? S.primaryB : S.border}`,
                  background: interval === i.value ? S.primaryBg : 'transparent', color: interval === i.value ? S.primary : S.muted,
                  fontSize: '0.8rem', fontWeight: interval === i.value ? 700 : 400, cursor: 'pointer',
                }}>
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { label: 'Mostrar thumbnail do clipe', val: showThumb, set: setShowThumb },
              { label: 'Mostrar contagem de views',  val: showViews, set: setShowViews },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: S.muted }}>{label}</span>
                <Toggle on={val} set={set} />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginTop: '1.25rem', background: S.card, border: `1px solid ${S.cardB}`, borderRadius: 12, padding: '1rem 1.1rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: S.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Preview</div>
          <div style={{
            background: theme === 'purple' ? 'rgba(155,48,255,0.15)' : theme === 'glass' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.75)',
            border: `1px solid ${theme === 'purple' ? S.primaryB : S.cardB}`,
            borderRadius: 10, padding: '0.75rem 0.9rem', display: 'flex', gap: '0.75rem', alignItems: 'center',
            backdropFilter: theme === 'glass' ? 'blur(12px)' : 'none', maxWidth: 380,
          }}>
            {showThumb && (
              <div style={{ width: 72, height: 40, borderRadius: 6, background: 'rgba(155,48,255,0.25)', border: `1px solid ${S.primaryB}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={S.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: S.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎬 Novo Clipe</span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Jogada incrível!</div>
              <div style={{ fontSize: '0.7rem', color: S.muted, marginTop: '0.1rem' }}>
                por @username {showViews && '· 42 views'}
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={save} disabled={saving || loading} style={{
            padding: '0.6rem 1.5rem', background: saved ? S.greenBg : S.primaryBg, border: `1px solid ${saved ? S.greenB : S.primaryB}`,
            color: saved ? S.green : S.primary, borderRadius: 9, fontSize: '0.88rem', fontWeight: 700,
            cursor: saving || loading ? 'default' : 'pointer',
          }}>
            {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar configuração'}
          </button>
        </div>
      </div>
    </div>
  )
}
