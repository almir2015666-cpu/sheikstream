'use client'
import { useState, useEffect } from 'react'

const C = {
  page: '#08090d',
  card: '#0d0f18',
  cardHi: '#111420',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.55)',
  dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff',
  primaryBg: 'rgba(155,48,255,0.12)',
  primaryBorder: 'rgba(155,48,255,0.25)',
  accent: '#39ff14',
  blue: '#3b82f6',
  blueBg: 'rgba(59,130,246,0.12)',
  blueBorder: 'rgba(59,130,246,0.25)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.9rem',
  background: '#08090d',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e8e6f8',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'rgba(232,230,248,0.38)',
  letterSpacing: '0.06em',
  marginBottom: '0.4rem',
  display: 'block',
  textTransform: 'uppercase',
}

type UserData = {
  id: string
  name: string
  email: string
  image: string
  platform?: string
  status?: string
  createdAt?: string
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: '44px', height: '24px',
        borderRadius: '12px',
        background: on ? C.blue : 'rgba(255,255,255,0.1)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: on ? '23px' : '3px',
        width: '18px', height: '18px',
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        display: 'block',
      }} />
    </button>
  )
}

function SummaryRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: '0.82rem', color: C.dim }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: highlight ? C.accent : C.text, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const ROLE_COLORS: Record<string, string> = { admin: '#ff4444', moderador: '#9147ff', vip: '#fbbf24', streamer: '#39ff14', parceiro: '#3b82f6', editor: '#f97316' }

export default function PerfilPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [form, setForm] = useState({ nome: '', nick: '', email: '', twitchUser: '', youtube: '' })
  const [platforms, setPlatforms] = useState({ twitch: false, youtube: false, discord: false })
  const [saved, setSaved] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then((u: UserData | null) => {
        if (!u) return
        setUser(u)
        const isTwitch = u.platform === 'Twitch'
        setForm({
          nome: u.name || '',
          nick: isTwitch ? u.name.toLowerCase() : '',
          email: u.email || '',
          twitchUser: isTwitch ? u.name : '',
          youtube: '',
        })
        setPlatforms(p => ({ ...p, twitch: isTwitch }))
        fetch('/api/me/role')
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.role) setUserRole(d.role) })
          .catch(() => {})
      })
      .catch(() => {})
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const statusLabel = user?.status ?? 'active'
  const statusColor = statusLabel === 'active' || statusLabel === 'approved' ? '#22c55e' : C.dim

  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Meu perfil</h2>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', alignItems: 'start', maxWidth: '860px' }}>

        {/* LEFT — Dados da conta */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Dados da conta</div>
            <div style={{ fontSize: '0.78rem', color: C.dim }}>Essas informações identificam seu usuário dentro da plataforma.</div>
          </div>

          <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
            {/* Row 1: Nome + Nick */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome de exibição" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nick</label>
                <input value={form.nick} onChange={e => setForm(p => ({ ...p, nick: e.target.value }))} placeholder="@apelido" style={inputStyle} />
              </div>
            </div>

            {/* Row 2: E-mail + Usuário Twitch */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="seu@email.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Usuário Twitch</label>
                <input
                  value={form.twitchUser}
                  readOnly
                  placeholder="—"
                  style={{ ...inputStyle, color: C.muted, cursor: 'default' }}
                />
              </div>
            </div>

            {/* Row 3: Canal YouTube (full width) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Canal YouTube</label>
              <input value={form.youtube} onChange={e => setForm(p => ({ ...p, youtube: e.target.value }))} placeholder="https://youtube.com/@seucanal" style={inputStyle} />
            </div>

            {/* Platform toggles */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.muted, marginBottom: '1rem' }}>Plataformas usadas</div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {(['twitch', 'youtube', 'discord'] as const).map(pl => (
                  <label key={pl} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', userSelect: 'none' }}>
                    <Toggle on={platforms[pl]} onChange={v => setPlatforms(p => ({ ...p, [pl]: v }))} />
                    <span style={{ fontSize: '0.875rem', color: platforms[pl] ? C.text : C.dim, textTransform: 'capitalize', transition: 'color 0.2s' }}>{pl.charAt(0).toUpperCase() + pl.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Save button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.55rem 1.3rem',
                  background: saved ? 'rgba(57,255,20,0.15)' : C.blue,
                  border: saved ? '1px solid rgba(57,255,20,0.3)' : 'none',
                  color: saved ? C.accent : '#fff',
                  borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {saved ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Salvo!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Salvar perfil
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT — Resumo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Avatar */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            {user?.image ? (
              <img src={user.image} alt="" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(155,48,255,0.3)' }} />
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: C.primaryBg, border: '3px solid rgba(155,48,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 900, color: C.primary }}>
                {(user?.name || 'U')[0].toUpperCase()}
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{user?.name || '...'}</div>
              <div style={{ fontSize: '0.74rem', color: C.dim, marginTop: '0.2rem' }}>{user?.email || ''}</div>
            </div>
          </div>

          {/* Resumo card */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.1rem 1.25rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.25rem' }}>Resumo</div>
            <div>
              <SummaryRow
                label="Status"
                value={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '0.74rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                    {statusLabel === 'approved' ? 'active' : statusLabel}
                  </span>
                }
              />
              <SummaryRow
                label="Função"
                value={userRole ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: `${ROLE_COLORS[userRole] ?? C.primaryBg}22`, border: `1px solid ${ROLE_COLORS[userRole] ?? C.primaryBg}44`, color: ROLE_COLORS[userRole] ?? C.primary, fontSize: '0.74rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', textTransform: 'capitalize' }}>
                    {userRole}
                  </span>
                ) : <span style={{ color: C.dim }}>Usuário</span>}
              />
              <SummaryRow
                label="Discord"
                value={<span style={{ color: C.dim }}>Não vinculado</span>}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', color: C.dim }}>Criado em</span>
                <span style={{ fontSize: '0.82rem', color: C.text, fontWeight: 600 }}>
                  {user?.createdAt ? formatDate(user.createdAt) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ background: C.card, border: '1px solid rgba(255,68,68,0.15)', borderRadius: '14px', padding: '1.1rem 1.25rem' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,107,107,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Zona de perigo</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Sair da conta</div>
                <div style={{ fontSize: '0.72rem', color: C.dim }}>Precisará fazer login novamente</div>
              </div>
              <button
                onClick={() => { window.location.href = '/api/logout' }}
                style={{ padding: '0.4rem 0.85rem', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: '#ff6b6b', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
