'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  page: '#08090d',
  card: '#0d0f18',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.55)',
  dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff',
  accent: '#39ff14',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem',
  background: '#08090d', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: '#e8e6f8', fontSize: '0.875rem',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

function PlatIcon({ id, color }: { id: string; color: string }) {
  const s = { width: 22, height: 22 }
  if (id === 'twitch')
    return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
  if (id === 'youtube')
    return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  if (id === 'kick')
    return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M2 2h4v8l6-8h5l-7 9 7 11h-5l-6-9v9H2z"/></svg>
  if (id === 'tiktok')
    return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.83a8.17 8.17 0 0 0 4.78 1.52V6.89a4.85 4.85 0 0 1-1.01-.2z"/></svg>
  if (id === 'paypal')
    return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.147 1.232 2.407 1.012 3.841-.096.579-.handle.html.handle.html.handle.html0 0 0 0-.01.01L20.15 5.66h.001c-.292 3.123-2.182 6.062-6.36 6.062h-2.56a.698.698 0 0 0-.69.591l-.87 5.525-.063.4-.001.008-.636 4.04a.371.371 0 0 1-.366.316h-.001l-.529-.265zM9.27 7.47h2.135c1.354 0 2.248-.494 2.558-2.082.288-1.478-.508-2.016-1.806-2.016H9.948l-.678 4.098zm11.316-5.246c-.276 3.563-2.45 5.81-6.376 5.81H12.2l-.877 5.596h-.001l-.637 4.04H7.25L9.96 2.83h7.46c1.33 0 2.39.285 3.17.938-.047-.044 0 0 .054.055-.027-.02-.054-.04-.057-.04z"/></svg>
  if (id === 'livepix')
    return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
  return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
}

type PlatCfg = {
  id: string; label: string; color: string; bg: string
  badge?: string; badgeColor?: string
  features: string[]
}

const PLATFORMS: PlatCfg[] = [
  { id: 'twitch',  label: 'Twitch',  color: '#9147ff', bg: 'rgba(145,71,255,0.12)', badge: 'ATUALIZADO', badgeColor: '#39ff14', features: ['Inscrições (subs)', 'Seguidores', 'Metas do canal'] },
  { id: 'youtube', label: 'YouTube', color: '#ff4444', bg: 'rgba(255,68,68,0.10)',   badge: 'ATUALIZADO', badgeColor: '#39ff14', features: ['Membros', 'Inscritos', 'Dados do canal'] },
  { id: 'kick',    label: 'Kick',    color: '#53fc18', bg: 'rgba(83,252,24,0.08)',   features: ['Inscrições (subs)', 'Seguidores', 'Chat do canal'] },
  { id: 'tiktok',  label: 'TikTok',  color: '#69c9d0', bg: 'rgba(105,201,208,0.08)', features: ['Conta do streamer', 'Subs TikTok', 'Sorteios'] },
  { id: 'paypal',  label: 'PayPal',  color: '#009cde', bg: 'rgba(0,156,222,0.08)',   features: ['Doações recebidas', 'Histórico de transações', 'Sorteios'] },
]

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.7rem', fontWeight: 600,
      padding: '0.18rem 0.55rem',
      borderRadius: '999px',
      background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
      border: connected ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.08)',
      color: connected ? '#22c55e' : C.dim,
    }}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
      </svg>
      {connected ? 'conectado' : 'desconectado'}
    </span>
  )
}

function FeatureChip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: '0.7rem', color: C.dim,
      padding: '0.2rem 0.6rem',
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
    }}>{label}</span>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: '36px', height: '20px', borderRadius: '10px',
      background: on ? '#9147ff' : 'rgba(255,255,255,0.1)',
      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
    }}>
      <span style={{
        position: 'absolute', top: '2px', left: on ? '18px' : '2px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  )
}

export default function ConexoesPage() {
  const router = useRouter()
  const [connectedUser, setConnectedUser] = useState<string | null>(null)
  const [botActive, setBotActive] = useState(false)
  const [livepix, setLivepix] = useState({ clientId: '', clientSecret: '', slug: '' })
  const [livepixSaving, setLivepixSaving] = useState(false)
  const [livepixSaved, setLivepixSaved] = useState(false)
  const [livepixErr, setLivepixErr] = useState('')
  const [livepixTableSql, setLivepixTableSql] = useState('')
  const [livepixSyncing, setLivepixSyncing] = useState(false)
  const [livepixSyncMsg, setLivepixSyncMsg] = useState('')
  const [syncResult, setSyncResult] = useState<{ synced: number; totalInDb: number } | null>(null)
  const [webhookCopied, setWebhookCopied] = useState(false)
  const [livepixDisconnecting, setLivepixDisconnecting] = useState(false)
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null)
  const [webhookOrigin, setWebhookOrigin] = useState('')
  const [tokenStatus, setTokenStatus] = useState({ twitch: false, youtube: false })
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect(platform: string) {
    setDisconnecting(true)
    try {
      await fetch('/api/tokens/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
      setTokenStatus(s => ({ ...s, [platform]: false }))
      if (platform === 'twitch') setConnectedUser(null)
    } finally {
      setDisconnecting(false)
    }
  }

  function openTwitchPopup() {
    const w = 500, h = 700
    const left = window.screen.width - w - 20
    const top = Math.max(0, (window.screen.height - h) / 2)
    const popup = window.open(
      '/api/auth/twitch?popup=1',
      'twitch_oauth',
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    )
    const check = setInterval(() => {
      if (popup?.closed) {
        clearInterval(check)
        fetch('/api/tokens/status')
          .then(r => r.json())
          .then(s => setTokenStatus(s))
          .catch(() => {})
        fetch('/api/me')
          .then(r => r.ok ? r.json() : null)
          .then(u => { if (u) setConnectedUser(u.name) })
          .catch(() => {})
      }
    }, 500)
  }

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u) setConnectedUser(u.name) })
      .catch(() => {})
    fetch('/api/tokens/status')
      .then(r => r.json())
      .then(s => setTokenStatus(s))
      .catch(() => {})
  }, [])

  async function handleLivepixConnect(e: React.FormEvent) {
    e.preventDefault()
    setLivepixSaving(true)
    setLivepixErr('')
    try {
      const body: Record<string, string | null> = {
        client_id: livepix.clientId || null,
        slug: livepix.slug || null,
      }
      if (livepix.clientSecret) body.client_secret = livepix.clientSecret
      const res = await fetch('/api/livepix/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setLivepixSaved(true)
        setLivepix(p => ({ ...p, clientSecret: '' }))
      } else {
        const d = await res.json().catch(() => ({}))
        if (d?.error === 'table_missing') {
          setLivepixTableSql(d.sql ?? '')
          setLivepixErr('Tabela livepix_config não encontrada no banco. Execute o SQL abaixo no Supabase para criá-la.')
        } else {
          setLivepixErr(d?.error ?? 'Erro ao salvar configuração')
        }
      }
    } catch {
      setLivepixErr('Erro de conexão')
    } finally {
      setLivepixSaving(false)
    }
  }

  async function handleLivepixSync() {
    setLivepixSyncing(true)
    setLivepixSyncMsg('')
    setSyncResult(null)
    try {
      const res = await fetch('/api/livepix/sync', { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setSyncResult({ synced: d.synced ?? 0, totalInDb: d.totalInDb ?? 0 })
        const today = new Date().toISOString().slice(0, 10)
        setLastSyncDate(today)
        try { localStorage.setItem('livepix-last-sync', today) } catch { /**/ }
      } else {
        setLivepixSyncMsg(`Erro: ${d.error ?? 'Falha ao sincronizar'}`)
      }
    } catch {
      setLivepixSyncMsg('Erro de conexão')
    } finally {
      setLivepixSyncing(false)
    }
  }

  async function handleLivepixDisconnect() {
    if (!confirm('Tem certeza que quer desconectar o Livepix? As doações já sincronizadas serão mantidas.')) return
    setLivepixDisconnecting(true)
    try {
      await fetch('/api/livepix/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: null, client_secret: null, slug: null, channel_id: null }),
      })
      setLivepixSaved(false)
      setLivepix({ clientId: '', clientSecret: '', slug: '' })
      setLivepixErr('')
    } catch { /* ignore */ } finally {
      setLivepixDisconnecting(false)
    }
  }

  async function handleSaveSlug(e: React.FormEvent) {
    e.preventDefault()
    setLivepixSaving(true)
    try {
      await fetch('/api/livepix/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: livepix.slug || null }),
      })
    } catch { /* ignore */ } finally {
      setLivepixSaving(false)
    }
  }

  function copyWebhook() {
    const url = `${webhookOrigin}/api/livepix/webhook/${encodeURIComponent(livepix.slug || 'meu-canal')}`
    navigator.clipboard.writeText(url).then(() => {
      setWebhookCopied(true)
      setTimeout(() => setWebhookCopied(false), 2000)
    }).catch(() => {})
  }

  useEffect(() => {
    setWebhookOrigin(window.location.origin)
    try {
      const d = localStorage.getItem('livepix-last-sync')
      if (d) setLastSyncDate(d)
    } catch { /**/ }
  }, [])

  useEffect(() => {
    fetch('/api/livepix/config')
      .then(r => r.json())
      .then(d => {
        if (d?.error === 'table_missing') {
          setLivepixTableSql(d.sql ?? '')
          setLivepixErr('Tabela livepix_config não encontrada no banco. Execute o SQL abaixo no Supabase para criá-la.')
          return
        }
        if (d?.client_id || d?.has_secret || d?.slug) {
          setLivepix(p => ({ ...p, clientId: d.client_id ?? '', slug: d.slug ?? '' }))
          setLivepixSaved(true)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Conexões das plataformas</h2>
      </div>

      {/* Bot banner */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: '12px', padding: '1rem 1.3rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(145,71,255,0.12)', border: '1px solid rgba(145,71,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9147ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Bot no Chat da Twitch</span>
              {tokenStatus.twitch
                ? <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.12rem 0.45rem', background: 'rgba(34,197,94,0.12)', color: '#22c55e', borderRadius: '999px', border: '1px solid rgba(34,197,94,0.2)' }}>conectado</span>
                : <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.12rem 0.45rem', background: 'rgba(251,191,36,0.12)', color: '#fbbf24', borderRadius: '999px', border: '1px solid rgba(251,191,36,0.2)' }}>pendente</span>
              }
            </div>
            <div style={{ fontSize: '0.76rem', color: C.dim, marginTop: '0.15rem' }}>
              {tokenStatus.twitch
                ? 'Token salvo. O bot está autorizado a enviar mensagens no seu chat.'
                : 'Conecte sua conta Twitch para que o bot opere no seu chat com comandos e sorteios.'
              }
            </div>
          </div>
        </div>
        {tokenStatus.twitch ? (
          <button
            onClick={() => handleDisconnect('twitch')}
            disabled={disconnecting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1.1rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: disconnecting ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, opacity: disconnecting ? 0.6 : 1 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
            {disconnecting ? 'Desconectando...' : 'Desconectar'}
          </button>
        ) : (
          <button
            onClick={() => { window.location.href = '/api/auth/twitch' }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1.1rem', background: '#9147ff', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <PlatIcon id="twitch" color="#fff" />
            Conectar Twitch
          </button>
        )}
      </div>

      {/* Platform grid 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem', marginBottom: '0.85rem' }}>
        {PLATFORMS.map(p => {
          const isConn = p.id === 'twitch' && !!connectedUser
          return (
            <div key={p.id} style={{ background: C.card, border: `1px solid ${isConn ? p.color + '30' : C.border}`, borderRadius: '12px', padding: '1.1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Title row */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: p.bg, border: `1px solid ${p.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PlatIcon id={p.id} color={p.color} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>{p.label}</span>
                      {p.badge && (
                        <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: p.badgeColor === '#39ff14' ? 'rgba(57,255,20,0.1)' : 'rgba(59,130,246,0.1)', color: p.badgeColor ?? '#39ff14', borderRadius: '999px', border: `1px solid ${(p.badgeColor ?? '#39ff14') + '30'}` }}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <StatusPill connected={isConn} />
                  </div>
                </div>
              </div>

              {/* Feature chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {p.features.map(f => <FeatureChip key={f} label={f} />)}
              </div>

              {/* Twitch extras when connected */}
              {isConn && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.65rem 0.8rem', background: 'rgba(145,71,255,0.06)', border: '1px solid rgba(145,71,255,0.15)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: C.text }}>Integração ativa</div>
                      <div style={{ fontSize: '0.7rem', color: C.dim }}>Bot usa esta plataforma quando ligado</div>
                    </div>
                    <Toggle on={botActive} onChange={setBotActive} />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: C.dim, padding: '0.45rem 0.65rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '6px', fontFamily: 'monospace' }}>
                    Canal detectado: <span style={{ color: C.muted }}>@{connectedUser}</span>
                  </div>
                </div>
              )}

              {/* Auth button */}
              <button
                onClick={() => p.id === 'twitch' ? (window.location.href = '/api/auth/twitch') : undefined}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                  padding: '0.55rem 0',
                  background: 'transparent',
                  border: `1px solid ${p.color}40`,
                  color: p.color,
                  borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                  cursor: 'pointer', width: '100%',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = p.bg }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Autenticar com {p.label}
              </button>
            </div>
          )
        })}
      </div>

      {/* Livepix — full width */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.25rem 1.4rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(255,105,180,0.12)', border: '1px solid rgba(255,105,180,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PlatIcon id="livepix" color="#ff69b4" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Livepix</span>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: 'rgba(57,255,20,0.1)', color: '#39ff14', borderRadius: '999px', border: '1px solid rgba(57,255,20,0.2)' }}>ATUALIZADO</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: '999px', background: livepixSaved ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: livepixSaved ? '1px solid rgba(34,197,94,0.2)' : `1px solid ${C.border}`, color: livepixSaved ? '#22c55e' : C.dim }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/></svg>
              {livepixSaved ? 'configurado' : 'não configurado'}
            </span>
          </div>
        </div>

        {/* Feature chips */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['Doações recebidas', 'Histórico', 'Sorteios'].map(f => <FeatureChip key={f} label={f} />)}
        </div>

        {livepixSaved ? (
          /* ── CONFIGURED STATE ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Slug save */}
            <form onSubmit={handleSaveSlug} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={livepix.slug}
                onChange={e => setLivepix(p => ({ ...p, slug: e.target.value }))}
                placeholder="Link Livepix (slug)"
                autoComplete="off"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="submit" disabled={livepixSaving}
                style={{ padding: '0.55rem 1rem', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                {livepixSaving ? '...' : 'Salvar link Livepix'}
              </button>
            </form>

            {/* Webhook section */}
            <div style={{ padding: '0.9rem 1rem', background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.2)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#39ff14', marginBottom: '0.3rem' }}>Webhook Livepix (doações em tempo real)</div>
              <div style={{ fontSize: '0.74rem', color: C.dim, marginBottom: '0.65rem' }}>Cole esta URL nas integrações da Livepix para receber doações automaticamente na sua conta.</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1, padding: '0.45rem 0.75rem', background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: '7px', fontSize: '0.75rem', color: C.muted, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {webhookOrigin}/api/livepix/webhook/{encodeURIComponent(livepix.slug || 'meu-canal')}
                </div>
                <button onClick={copyWebhook}
                  style={{ width: 34, height: 34, flexShrink: 0, background: webhookCopied ? 'rgba(57,255,20,0.12)' : 'transparent', border: `1px solid ${webhookCopied ? 'rgba(57,255,20,0.3)' : C.border}`, borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: webhookCopied ? '#39ff14' : C.dim }}>
                  {webhookCopied
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  }
                </button>
              </div>
            </div>

            {livepixSyncMsg && (
              <div style={{ fontSize: '0.76rem', color: '#ef4444', padding: '0.4rem 0.7rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px' }}>
                {livepixSyncMsg}
              </div>
            )}

            {/* Sync button */}
            {(() => {
              const today = new Date().toISOString().slice(0, 10)
              const canSync = !lastSyncDate || lastSyncDate < today
              const nextDate = lastSyncDate ? new Date(new Date(lastSyncDate).getTime() + 86400000).toLocaleDateString('pt-BR') : ''
              return (
                <button type="button" disabled={!canSync || livepixSyncing} onClick={handleLivepixSync}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.58rem 0', background: (canSync && !livepixSyncing) ? 'rgba(255,105,180,0.08)' : 'transparent', border: '1px solid rgba(255,105,180,0.25)', color: (canSync && !livepixSyncing) ? '#ff69b4' : C.dim, borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: (canSync && !livepixSyncing) ? 'pointer' : 'default', opacity: livepixSyncing ? 0.6 : 1 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  {livepixSyncing ? 'Sincronizando...' : canSync ? 'Sync Livepix' : `Sync (disp. ${nextDate})`}
                </button>
              )
            })()}

            {/* Disconnect */}
            <button type="button" disabled={livepixDisconnecting} onClick={handleLivepixDisconnect}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.58rem 0', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', opacity: livepixDisconnecting ? 0.6 : 1 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              {livepixDisconnecting ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        ) : (
          /* ── NOT CONFIGURED STATE ── */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.25rem', alignItems: 'start' }}>
            <div style={{ padding: '0.9rem 1rem', background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.15)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#39ff14', marginBottom: '0.65rem' }}>Como conectar</div>
              <ol style={{ margin: 0, padding: '0 0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  'Acesse sua conta Livepix e abra a área de integrações/API.',
                  'Crie uma aplicação e copie o Client ID e Client Secret.',
                  'Cole os dados abaixo e clique em Salvar e Conectar.',
                  'Depois de conectado, use Sync para importar o histórico.',
                ].map((step, i) => (
                  <li key={i} style={{ fontSize: '0.76rem', color: C.dim, lineHeight: 1.5 }}>{step}</li>
                ))}
              </ol>
            </div>
            <form onSubmit={handleLivepixConnect} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <input value={livepix.clientId} onChange={e => setLivepix(p => ({ ...p, clientId: e.target.value }))} placeholder="Client ID" autoComplete="off" style={inputStyle} />
              <input type="password" value={livepix.clientSecret} onChange={e => setLivepix(p => ({ ...p, clientSecret: e.target.value }))} placeholder="Client Secret" autoComplete="new-password" style={inputStyle} />
              <input value={livepix.slug} onChange={e => setLivepix(p => ({ ...p, slug: e.target.value }))} placeholder="Slug (ex: meu-canal)" autoComplete="off" style={inputStyle} />
              {livepixErr && (
                <div style={{ fontSize: '0.76rem', color: '#ef4444', padding: '0.5rem 0.7rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px' }}>
                  {livepixErr}
                  {livepixTableSql && <pre style={{ marginTop: '0.5rem', padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', fontSize: '0.7rem', color: '#f0f0f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', userSelect: 'all' }}>{livepixTableSql}</pre>}
                </div>
              )}
              <button type="submit" disabled={livepixSaving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.58rem 0', background: 'transparent', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: livepixSaving ? 'default' : 'pointer', opacity: livepixSaving ? 0.6 : 1 }}>
                {livepixSaving ? 'Salvando...' : 'Salvar e Conectar'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Sync success modal */}
      {syncResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setSyncResult(null)}>
          <div style={{ background: '#111219', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem', maxWidth: '420px', width: '100%', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button onClick={() => setSyncResult(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'rgba(232,230,248,0.3)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>

            {/* Icon */}
            <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.8rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
              </svg>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: C.text, marginBottom: '0.35rem' }}>Livepix sincronizado!</div>
              <div style={{ fontSize: '0.85rem', color: C.muted }}>
                {syncResult.synced > 0 ? `${syncResult.synced} doações importadas` : 'Nenhuma doação nova — já estava atualizado.'}
              </div>
            </div>

            {/* Stats */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.82rem', color: C.muted }}>Total na base</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#39ff14' }}>{syncResult.totalInDb} doação{syncResult.totalInDb !== 1 ? 'ões' : ''}</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button onClick={() => router.push('/dashboard/plataformas/livepix')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Ver doadores
              </button>
              <button onClick={() => setSyncResult(null)}
                style={{ flex: 1, padding: '0.65rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: C.muted, borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
