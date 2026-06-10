'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const C = {
  bg: '#08090d', card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#53fc18', primaryBg: 'rgba(83,252,24,0.07)', primaryB: 'rgba(83,252,24,0.25)',
  border: 'rgba(255,255,255,0.07)', red: '#ef4444',
}

type Period = '7d' | '30d' | '90d' | 'custom'
const PERIODS: [Period, string][] = [['7d','7 dias'],['30d','30 dias'],['90d','90 dias'],['custom','Personalizado']]

type KickStats  = { total_subs: number; gift_subs: number; tickets_gerados: number; total_bruto: number; total_liquido: number; usd_rate: number; tiers: { tier1: number; tier2: number; tier3: number } }
type KickSub    = { id: string; type: string; username: string; count: number; created_at: string }
type KickTiers  = { tier1_name: string; tier1_value: number; tier2_name: string; tier2_value: number; tier3_name: string; tier3_value: number }
type TokenStatus = { kick: boolean; kick_username: string | null; kick_channel_id: string | null }

function fmtBRL(v: number) { return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgoStr(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }

export default function KickPlataformaPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [customFrom, setCustomFrom] = useState(daysAgoStr(30))
  const [customTo, setCustomTo] = useState(todayStr())

  const [connected, setConnected] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [channelId, setChannelId] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(true)

  // Live channel info
  const [followers, setFollowers] = useState<number | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [streamTitle, setStreamTitle] = useState<string | null>(null)
  const [viewerCount, setViewerCount] = useState<number | null>(null)
  const [tokenValid, setTokenValid] = useState(true)
  const [channelLoading, setChannelLoading] = useState(false)

  const [stats, setStats] = useState<KickStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const [subs, setSubs] = useState<KickSub[]>([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [disconnecting, setDisconnecting] = useState(false)

  // Sync modal
  const [showSync, setShowSync] = useState(false)
  const [syncSubCount, setSyncSubCount] = useState(0)

  // Tiers modal
  const [showTiers, setShowTiers] = useState(false)
  const [tiers, setTiers] = useState<KickTiers>({ tier1_name: 'Tier 1', tier1_value: 28.4, tier2_name: 'Tier 2', tier2_value: 56.95, tier3_name: 'Tier 3', tier3_value: 142.44 })
  const [tiersSaving, setTiersSaving] = useState(false)
  const [tiersHasWarning, setTiersHasWarning] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  // Add sub modal
  const [showAddSub, setShowAddSub] = useState(false)
  const [addSubUsername, setAddSubUsername] = useState('')
  const [addSubTier, setAddSubTier] = useState('tier1')
  const [addSubGift, setAddSubGift] = useState(false)
  const [addSubTickets, setAddSubTickets] = useState(1)
  const [addSubDate, setAddSubDate] = useState('')
  const [addSubSaving, setAddSubSaving] = useState(false)
  const [addSubError, setAddSubError] = useState('')

  const USD_RATE = stats?.usd_rate ?? 5.70
  const PAYMENT_GOAL_USD = 100

  function periodDates() {
    if (period === 'custom') return { from: customFrom, to: customTo }
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    return { from: daysAgoStr(days), to: todayStr() }
  }

  useEffect(() => {
    fetch('/api/tokens/status')
      .then(r => r.json())
      .then((s: TokenStatus) => { setConnected(!!s.kick); setUsername(s.kick_username ?? null); setChannelId(s.kick_channel_id ?? null) })
      .catch(() => {})
      .finally(() => setTokenLoading(false))
    fetch('/api/kick/tiers')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setTiers(d); setTiersHasWarning(false) } })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!connected) return
    const { from, to } = periodDates()
    setStatsLoading(true)
    fetch(`/api/kick/stats?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
    setSubsLoading(true)
    fetch(`/api/kick/subs?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d)) setSubs(d) })
      .catch(() => {})
      .finally(() => setSubsLoading(false))
  }, [connected, period, customFrom, customTo])

  useEffect(() => {
    if (!connected) return
    setChannelLoading(true)
    fetch('/api/kick/channel')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.username)    setUsername(d.username)
        if (d.channel_id)  setChannelId(d.channel_id)
        setFollowers(d.followers ?? null)
        setIsLive(!!d.is_live)
        setStreamTitle(d.stream_title ?? null)
        setViewerCount(d.viewer_count ?? null)
        setTokenValid(d.token_valid !== false)
      })
      .catch(() => {})
      .finally(() => setChannelLoading(false))
  }, [connected])

  function openKickPopup() {
    const w = 500, h = 700
    const left = window.screen.width - w - 20
    const top  = Math.max(0, (window.screen.height - h) / 2)
    const popup = window.open('/api/auth/kick?popup=1', 'kick_oauth', `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`)
    if (!popup) { window.location.href = '/api/auth/kick'; return }
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'kick_connected') {
        window.removeEventListener('message', onMessage)
        clearInterval(check)
        fetch('/api/tokens/status').then(r => r.json()).then((s: TokenStatus) => {
          setConnected(!!s.kick); setUsername(s.kick_username ?? null); setChannelId(s.kick_channel_id ?? null)
          if (s.kick) {
            fetch('/api/kick/stats').then(r => r.ok ? r.json() : null).then(d => {
              setSyncSubCount(d?.total_subs ?? 0)
              setShowSync(true)
            }).catch(() => setShowSync(true))
          }
        }).catch(() => {})
      } else if (e.data?.type === 'kick_error') {
        window.removeEventListener('message', onMessage)
        clearInterval(check)
        alert(`Erro ao conectar Kick: ${e.data.error ?? 'desconhecido'}`)
      }
    }
    window.addEventListener('message', onMessage)
    const check = setInterval(() => {
      if (popup.closed) { clearInterval(check); window.removeEventListener('message', onMessage) }
    }, 500)
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await fetch('/api/tokens/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'kick' }) })
      setConnected(false); setUsername(null); setStats(null); setSubs([])
    } finally { setDisconnecting(false) }
  }

  async function handleVerificar() {
    setVerifying(true)
    try {
      const { from, to } = periodDates()
      const d = await fetch(`/api/kick/stats?from=${from}&to=${to}`).then(r => r.ok ? r.json() : null)
      const count = d?.total_subs ?? 0
      setToast(`Kick verificado: ${count} sub${count !== 1 ? 's' : ''} registrado${count !== 1 ? 's' : ''}`)
      setTimeout(() => setToast(null), 4000)
      if (d) setStats(d)
    } catch {
      setToast('Erro ao verificar Kick')
      setTimeout(() => setToast(null), 4000)
    } finally {
      setVerifying(false)
    }
  }

  async function saveTiers() {
    setTiersSaving(true)
    try {
      await fetch('/api/kick/tiers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tiers) })
      setTiersHasWarning(false)
      setShowTiers(false)
    } catch {} finally { setTiersSaving(false) }
  }

  const filteredSubs = subs.filter(s => !search || s.username.toLowerCase().includes(search.toLowerCase()))

  if (tokenLoading) {
    return <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontFamily: "-apple-system,'Inter',system-ui,sans-serif" }}>Carregando...</div>
  }

  if (!connected) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '2rem 3rem', maxWidth: '1440px', margin: '0 auto', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Link href="/dashboard/plataformas" style={{ color: C.dim, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Plataformas
          </Link>
          <span style={{ color: C.vdim }}>/</span>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Kick</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: '100%', maxWidth: '480px' }}>
            <div style={{ background: C.card, border: `1px solid ${C.primaryB}`, borderRadius: '20px', padding: '2.8rem 2.2rem', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '18px', background: C.primaryBg, border: `1px solid ${C.primaryB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.4rem', fontSize: '2.2rem', fontWeight: 900, color: C.primary, boxShadow: `0 0 24px ${C.primary}22` }}>K</div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.55rem' }}>Conectar Kick</div>
              <div style={{ fontSize: '0.84rem', color: C.dim, marginBottom: '2rem', lineHeight: 1.65, maxWidth: 340, margin: '0 auto 2rem' }}>Integre sua conta Kick para capturar subs, gifted subs e follows em tempo real durante suas lives.</div>
              <button onClick={openKickPopup} style={{ padding: '0.75rem 2.5rem', background: C.primary, color: '#000', border: 'none', borderRadius: '12px', fontSize: '0.92rem', fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 20px ${C.primary}44` }}>
                Conectar com Kick
              </button>
              <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[['Subs em tempo real', '⚡'], ['Gifted subs', '🎁'], ['Estimativa de repasse', '💰']].map(([label, icon]) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.75rem 0.5rem', fontSize: '0.7rem', color: C.dim }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{icon}</div>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const brutoPerSub = stats?.tiers.tier1 ?? 28.4
  const goalBRL     = PAYMENT_GOAL_USD * USD_RATE
  const bruto       = stats?.total_bruto ?? 0
  const liquido     = stats?.total_liquido ?? 0
  const progressPct = Math.min(100, (liquido / goalBRL) * 100)

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '2rem 3rem', maxWidth: '1440px', margin: '0 auto', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, background: C.primaryBg, border: `1px solid ${C.primaryB}`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: C.primary, fontSize: '1rem' }}>K</div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Kick</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Period selector */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              {PERIODS.map(([p, label]) => (
                <button key={p} onClick={() => setPeriod(p)} style={{ padding: '0.28rem 0.75rem', borderRadius: '6px', border: 'none', background: p === period ? C.primaryBg : 'transparent', color: p === period ? C.primary : C.dim, fontSize: '0.77rem', fontWeight: p === period ? 700 : 400, cursor: 'pointer', outline: p === period ? `1px solid ${C.primaryB}` : 'none', outlineOffset: '-1px' }}>
                  {label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(83,252,24,0.25)', borderRadius: '6px', color: C.text, fontSize: '0.77rem', padding: '0.28rem 0.6rem', outline: 'none', colorScheme: 'dark' }} />
                <span style={{ fontSize: '0.72rem', color: C.dim }}>até</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} min={customFrom} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(83,252,24,0.25)', borderRadius: '6px', color: C.text, fontSize: '0.77rem', padding: '0.28rem 0.6rem', outline: 'none', colorScheme: 'dark' }} />
              </div>
            )}
            {/* Action buttons */}
            <button onClick={() => setShowTiers(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
              Ajustar níveis {tiersHasWarning && <span style={{ background: '#fbbf24', color: '#000', borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900 }}>!</span>}
            </button>
            <button onClick={handleVerificar} disabled={verifying} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'rgba(83,252,24,0.06)', border: `1px solid ${C.primaryB}`, color: C.primary, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: verifying ? 'default' : 'pointer', opacity: verifying ? 0.7 : 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={verifying ? { animation: 'spin 1s linear infinite' } : {}}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
              {verifying ? 'Verificando...' : 'Verificar Kick'}
            </button>
            <button onClick={() => { setShowAddSub(true); setAddSubError('') }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: C.primaryBg, border: `1px solid ${C.primaryB}`, color: C.primary, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              + Adicionar Sub
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.65rem', marginBottom: '0.8rem' }}>
          {[
            { label: 'Total subs',       value: statsLoading ? '...' : String(stats?.total_subs ?? 0),      sub: 'registrados' },
            { label: 'Gift subs',        value: statsLoading ? '...' : String(stats?.gift_subs ?? 0),       sub: 'presenteados' },
            { label: 'Tickets gerados',  value: statsLoading ? '...' : String(stats?.tickets_gerados ?? 0), sub: 'para sorteio' },
            { label: 'Total bruto',      value: statsLoading ? '...' : fmtBRL(bruto),                       sub: 'pago pelos subs',  green: true },
            { label: 'Total líquido',    value: statsLoading ? '...' : fmtBRL(liquido),                     sub: `≈ U$ ${(liquido / USD_RATE).toFixed(2)}`, green: true },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '0.9rem 1rem' }}>
              <div style={{ fontSize: '0.68rem', color: C.muted, marginBottom: '0.4rem' }}>{s.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px', color: (s as {green?: boolean}).green ? C.primary : C.text }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: C.vdim, marginTop: '0.12rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Channel card + Repasse */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.8rem', marginBottom: '0.8rem' }}>

          {/* Channel */}
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '16px', padding: '1.2rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: C.primaryBg, border: `1px solid ${C.primaryB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: C.primary, flexShrink: 0, boxShadow: `0 0 12px ${C.primary}22` }}>KI</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {channelLoading ? '...' : (username || 'Canal Kick')}
                </div>
                {channelId && <div style={{ fontSize: '0.68rem', color: C.dim, marginTop: '0.1rem' }}>ID: {channelId}</div>}
              </div>
            </div>

            {/* Token warning */}
            {!tokenValid && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.65rem', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '7px', fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                token expirado — reconecte em Conexões
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: C.dim, marginBottom: '0.25rem' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Seguidores
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {channelLoading ? '...' : (followers !== null ? followers.toLocaleString('pt-BR') : '—')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: C.dim, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>
                  Status
                </div>
                {isLive ? (
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                      AO VIVO
                    </span>
                    {viewerCount !== null && <div style={{ fontSize: '0.65rem', color: C.vdim, marginTop: '0.1rem' }}>{viewerCount.toLocaleString('pt-BR')} espectadores</div>}
                    {streamTitle && <div style={{ fontSize: '0.65rem', color: C.dim, marginTop: '0.1rem', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{streamTitle}</div>}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: C.vdim }}>Canal offline</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.45rem', marginTop: 'auto', paddingTop: '0.25rem', borderTop: `1px solid ${C.border}` }}>
              <button onClick={openKickPopup} style={{ flex: 1, fontSize: '0.72rem', padding: '0.38rem 0', background: C.primaryBg, border: `1px solid ${C.primaryB}`, color: C.primary, borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>Reconectar</button>
              <button disabled={disconnecting} onClick={handleDisconnect} style={{ flex: 1, fontSize: '0.72rem', padding: '0.38rem 0', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: C.red, borderRadius: '6px', cursor: 'pointer', fontWeight: 700, opacity: disconnecting ? 0.6 : 1 }}>
                {disconnecting ? '...' : 'Desconectar'}
              </button>
            </div>
          </div>

          {/* Repasse */}
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '16px', padding: '1.2rem 1.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
              <span style={{ color: C.primary }}>$</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.text }}>Estimativa de Repasse Kick</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.67rem', color: C.dim }}>estimativa</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
              {[
                { label: 'Arrecadado bruto', value: fmtBRL(bruto),   sub: 'pago pelos subs' },
                { label: 'Repasse líquido',  value: fmtBRL(liquido), sub: '50% do bruto',     green: true },
                { label: 'Equivalente em U$', value: `U$ ${(liquido / USD_RATE).toFixed(2)}`, sub: `cotação R$ ${USD_RATE.toFixed(2)}` },
              ].map(r => (
                <div key={r.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '0.65rem' }}>
                  <div style={{ fontSize: '0.65rem', color: C.dim, marginBottom: '0.25rem' }}>{r.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: (r as {green?: boolean}).green ? C.primary : C.text }}>{r.value}</div>
                  <div style={{ fontSize: '0.63rem', color: C.vdim }}>{r.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: C.dim, marginBottom: '0.35rem' }}>
                <span>Meta de pagamento Kick <strong style={{ color: C.text }}>U${PAYMENT_GOAL_USD} · {fmtBRL(goalBRL)}</strong></span>
                <span>faltam <strong style={{ color: C.text }}>U${Math.max(0, PAYMENT_GOAL_USD - liquido / USD_RATE).toFixed(2)} ({fmtBRL(Math.max(0, goalBRL - liquido))})</strong> <span style={{ color: C.primary }}>{progressPct.toFixed(1)}%</span></span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.primary, borderRadius: 3, width: `${progressPct}%`, transition: 'width 0.4s', boxShadow: `0 0 8px ${C.primary}80` }} />
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: C.dim, marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Próximo pagamento estimado: <strong style={{ color: C.text }}>15 de julho de 2026</strong> — se meta for atingida
              <a href="https://kick.com" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', color: C.primary, fontSize: '0.68rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                Ver no Kick Dashboard
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Subs table */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '16px', padding: '1.1rem 1.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: C.dim, fontWeight: 600 }}>
              Subs no período: {period === '7d' ? '7d' : period === '90d' ? '90d' : period === 'custom' ? 'custom' : '30d'} · <span style={{ color: C.vdim }}>{filteredSubs.length} resultado{filteredSubs.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(232,230,248,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por usuário..."
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: C.text, fontSize: '0.78rem', padding: '0.4rem 0.75rem 0.4rem 2rem', outline: 'none', width: 200 }} />
              </div>
              <select style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: C.muted, fontSize: '0.78rem', padding: '0.4rem 0.75rem', outline: 'none', cursor: 'pointer' }}>
                <option>Mais recente</option>
              </select>
            </div>
          </div>
          {subsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: C.vdim, fontSize: '0.8rem' }}>Carregando...</div>
          ) : filteredSubs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', color: C.vdim, gap: '0.5rem' }}>
              <div style={{ fontSize: '2rem', opacity: 0.3 }}>K</div>
              <div style={{ fontSize: '0.8rem' }}>Nenhum sub encontrado no período</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {filteredSubs.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0.5rem', borderRadius: '7px', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: s.type === 'gift' ? 'rgba(251,191,36,0.1)' : 'rgba(83,252,24,0.08)', color: s.type === 'gift' ? '#fbbf24' : C.primary, fontWeight: 700 }}>
                    {s.type === 'gift' ? `🎁 ×${s.count}` : 'Sub'}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>{s.username}</span>
                  <span style={{ fontSize: '0.7rem', color: C.vdim }}>{new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Kick sync success modal */}
      {showSync && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#111219', border: `1px solid ${C.primaryB}`, borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '100%', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setShowSync(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
            <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'rgba(83,252,24,0.12)', border: `1px solid ${C.primaryB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#53fc18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: C.text, marginBottom: '0.35rem' }}>Kick sincronizado!</div>
            <div style={{ fontSize: '0.84rem', color: C.dim, marginBottom: '1.75rem' }}>{syncSubCount} sub{syncSubCount !== 1 ? 's' : ''} encontrado{syncSubCount !== 1 ? 's' : ''}</div>
            <button onClick={() => { setShowSync(false); setShowTiers(true) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', background: 'rgba(83,252,24,0.06)', border: `1px solid ${C.primaryB}`, color: C.primary, borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginBottom: '0.6rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
              Configurar Níveis de Assinatura
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { setShowSync(false); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) }}
                style={{ flex: 1, padding: '0.6rem', background: C.primaryBg, border: `1px solid ${C.primaryB}`, color: C.primary, borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Ver inscrições Kick
              </button>
              <button onClick={() => setShowSync(false)}
                style={{ flex: 1, padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: C.muted, borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tiers config modal */}
      {showTiers && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setShowTiers(false) }}>
          <div style={{ background: '#111219', border: `1px solid ${C.primaryB}`, borderRadius: '16px', padding: '1.75rem', maxWidth: '400px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text }}>Configurar Níveis — Kick</div>
                <div style={{ fontSize: '0.75rem', color: C.dim, marginTop: '0.2rem' }}>Ajuste o valor de cada tier de inscrição.</div>
              </div>
              <button onClick={() => setShowTiers(false)} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.2rem' }}>✕</button>
            </div>
            <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {([['tier1', 'TIER 1'], ['tier2', 'TIER 2'], ['tier3', 'TIER 3']] as [string, string][]).map(([key, label]) => (
                <div key={key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, letterSpacing: '0.5px', marginBottom: '0.75rem' }}>{label}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: C.vdim, display: 'block', marginBottom: '0.25rem' }}>NOME</label>
                      <input value={(tiers as Record<string, string | number>)[`${key}_name`] as string}
                        onChange={e => setTiers(prev => ({ ...prev, [`${key}_name`]: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: C.text, fontSize: '0.85rem', padding: '0.5rem 0.75rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: C.vdim, display: 'block', marginBottom: '0.25rem' }}>VALOR (R$)</label>
                      <input type="number" step="0.01" value={(tiers as Record<string, string | number>)[`${key}_value`] as number}
                        onChange={e => setTiers(prev => ({ ...prev, [`${key}_value`]: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: C.text, fontSize: '0.85rem', padding: '0.5rem 0.75rem', outline: 'none' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem' }}>
              <button onClick={() => { setTiers({ tier1_name: 'Tier 1', tier1_value: 28.4, tier2_name: 'Tier 2', tier2_value: 56.95, tier3_name: 'Tier 3', tier3_value: 142.44 }) }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: C.muted, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
                Padrões
              </button>
              <button onClick={() => setShowTiers(false)}
                style={{ flex: 1, padding: '0.55rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: C.muted, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button disabled={tiersSaving} onClick={saveTiers}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem', background: C.primaryBg, border: `1px solid ${C.primaryB}`, color: C.primary, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', opacity: tiersSaving ? 0.7 : 1 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {tiersSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adicionar Sub modal */}
      {showAddSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1a1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: C.text }}>Adicionar Sub Kick</div>
              <button onClick={() => setShowAddSub(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0.1rem 0.3rem' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem', marginBottom: '1.1rem' }}>
              <div style={{ gridColumn: '1' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Usuário que assinou <span style={{ color: '#ef4444' }}>*</span></div>
                <input
                  type="text" placeholder="@usuario_kick" value={addSubUsername} onChange={e => setAddSubUsername(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: C.text, fontSize: '0.85rem', padding: '0.6rem 0.8rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Tier</div>
                <select value={addSubTier} onChange={e => setAddSubTier(e.target.value)}
                  style={{ width: '100%', background: '#1a1c2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: C.text, fontSize: '0.85rem', padding: '0.6rem 0.8rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="tier1">Tier 1</option>
                  <option value="tier2">Tier 2</option>
                  <option value="tier3">Tier 3</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: '1rem' }}>
              <input type="checkbox" checked={addSubGift} onChange={e => setAddSubGift(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.primary, cursor: 'pointer' }} />
              <span style={{ fontSize: '0.84rem', color: C.muted }}>É um gift sub?</span>
            </label>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Tickets a conceder</div>
              <input
                type="number" min={1} max={100} value={addSubTickets} onChange={e => setAddSubTickets(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: C.text, fontSize: '0.85rem', padding: '0.6rem 0.8rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Data do sub</div>
              <input
                type="datetime-local" value={addSubDate} onChange={e => setAddSubDate(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: C.text, fontSize: '0.85rem', padding: '0.6rem 0.8rem', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ background: 'rgba(83,252,24,0.07)', border: '1px solid rgba(83,252,24,0.2)', borderRadius: '8px', padding: '0.7rem 0.9rem', fontSize: '0.78rem', color: C.primary, lineHeight: 1.5, marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '0.1rem' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Streamers Kick conectados terão seus subs registrados automaticamente via webhook. Use este formulário para registros manuais.
            </div>

            {addSubError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '0.55rem 0.75rem', fontSize: '0.78rem', color: '#fca5a5', marginBottom: '0.9rem' }}>
                {addSubError}
              </div>
            )}

            <button
              disabled={!addSubUsername.trim() || addSubSaving}
              onClick={async () => {
                if (!addSubUsername.trim()) return
                setAddSubSaving(true); setAddSubError('')
                try {
                  const res = await fetch('/api/kick/add-sub', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      username: addSubUsername.trim().replace(/^@/, ''),
                      tier: addSubTier,
                      is_gift: addSubGift,
                      tickets: addSubTickets,
                      date: addSubDate || new Date().toISOString(),
                    }),
                  })
                  if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro ao adicionar') }
                  setShowAddSub(false)
                  setAddSubUsername(''); setAddSubTier('tier1'); setAddSubGift(false); setAddSubTickets(1); setAddSubDate('')
                  const { from, to } = periodDates()
                  fetch(`/api/kick/subs?from=${from}&to=${to}`).then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d)) setSubs(d) })
                } catch (e: unknown) {
                  setAddSubError(e instanceof Error ? e.message : 'Erro ao adicionar sub')
                } finally { setAddSubSaving(false) }
              }}
              style={{ width: '100%', padding: '0.75rem', background: addSubUsername.trim() ? 'linear-gradient(135deg,#4f8aff,#2563eb)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: addSubUsername.trim() ? '#fff' : C.vdim, fontWeight: 800, fontSize: '0.9rem', cursor: addSubUsername.trim() && !addSubSaving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              {addSubSaving ? 'Adicionando...' : 'Adicionar sub'}
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 2000, display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1.1rem', background: '#111219', border: `1px solid ${C.primaryB}`, borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontSize: '0.84rem', fontWeight: 600, color: C.text, animation: 'fadeInUp 0.2s ease' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#53fc18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          {toast}
        </div>
      )}
    </div>
  )
}
