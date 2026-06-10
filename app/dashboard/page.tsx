'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.15)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.08)',
}

type Period = '7d' | '30d' | '90d' | 'custom'
const PERIODS: [Period, string][] = [['7d','7 dias'],['30d','30 dias'],['90d','90 dias'],['custom','Personalizado']]

const PLAT_TOTALS = [
  { name: 'Livepix',  color: '#ff4d6d', sym: '♥' },
  { name: 'Twitch',   color: '#9147ff', sym: '◈' },
  { name: 'YouTube',  color: '#ff0000', sym: '▶' },
  { name: 'Kick',     color: '#53fc18', sym: '⊡' },
  { name: 'TikTok',   color: '#69c9d0', sym: '♪' },
  { name: 'PayPal',   color: '#009cde', sym: '⊞' },
]

const STATS = [
  { label: 'Tickets ativos',  value: '0',       sub: 'em circulação',  badge: false },
  { label: 'Participantes',   value: '0',       sub: 'únicos',         badge: false },
  { label: 'Total Livepix',   value: 'R$ 0,00', sub: 'no período',     badge: true  },
  { label: 'Total PayPal',    value: 'R$ 0,00', sub: 'no período',     badge: true  },
  { label: 'Subs Twitch',     value: '0',       sub: 'no período',     badge: false },
  { label: 'Membros YouTube', value: '0',       sub: 'no período',     badge: false },
  { label: 'Subs Kick',       value: '0',       sub: 'no período',     badge: false },
  { label: 'Subs TikTok',     value: '0',       sub: 'no período',     badge: false },
]

const REPASSE = [
  { label: 'Livepix', color: '#ff2d6b', pct: 95, note: 'pago em R$' },
  { label: 'Twitch',  color: '#a855f7', pct: 50, note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'YouTube', color: '#ff3333', pct: 70, note: 'U$ 0,00 · 0,0% de U$100' },
  { label: 'Kick',    color: '#39ff14', pct: 50, note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'TikTok',  color: '#00e5ff', pct: 50, note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'PayPal',  color: '#00b4ff', pct: 97, note: 'pago em R$' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function daysAgoStr(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

type Stats = {
  livepix_total: number; livepix_donors: number; livepix_unique: number
  twitch_subs: number; twitch_tickets: number; twitch_total: number; tickets_total: number; participants: number
}
type Activity = { id: string; platform: string; type: string; username: string; amount?: number; created_at: string }
type ChannelStats = {
  broadcaster_name: string; title: string; game_name: string
  is_live: boolean; viewer_count: number; started_at: string | null
  follower_count: number | null; view_count: number | null; language: string; broadcaster_login: string
}

function fmtBRL(v: number) { return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmtNum(v: number) { return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) }

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [customFrom, setCustomFrom] = useState(daysAgoStr(30))
  const [customTo, setCustomTo] = useState(todayStr())
  const [isMobile, setIsMobile] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [channel, setChannel] = useState<ChannelStats | null>(null)
  const [channelErr, setChannelErr] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const [activities, setActivities] = useState<Activity[] | null>(null)
  const periodLabel = PERIODS.find(([p]) => p === period)?.[1] ?? '30 dias'

  function periodDates() {
    if (period === 'custom') return { from: customFrom, to: customTo }
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    return { from: daysAgoStr(days), to: todayStr() }
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setRefreshTick(t => t + 1), 60000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const { from, to } = periodDates()
    setStatsLoading(true)
    fetch(`/api/dashboard/stats?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
    fetch(`/api/dashboard/activity?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: Activity[] | null) => { if (d) setActivities(d) })
      .catch(() => {})
  }, [period, customFrom, customTo, refreshTick])

  useEffect(() => {
    const load = () =>
      fetch('/api/twitch/channel-stats')
        .then(r => r.ok ? r.json() : r.json().then((d: {error: string}) => Promise.reject(d.error)))
        .then((d: ChannelStats) => { setChannel(d); setChannelErr('') })
        .catch((e: string) => setChannelErr(e || 'Conta Twitch não conectada'))
    load()
    const iv = setInterval(load, 60000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Banner de boas-vindas */}
      <div style={{ background: 'linear-gradient(90deg,rgba(59,130,246,0.12),rgba(99,102,241,0.06))', borderBottom: '1px solid rgba(59,130,246,0.15)', padding: isMobile ? '0.6rem 1rem' : '0.6rem 2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1rem' }}>🚀</span>
        <span style={{ fontSize: '0.81rem', color: '#93c5fd', fontWeight: 700 }}>Bem-vindo ao Beta!</span>
        <span style={{ fontSize: '0.81rem', color: C.dim }}>
          Seu painel está pronto. Configure suas{' '}
          <Link href="/dashboard/conexoes" style={{ color: '#9b30ff', textDecoration: 'none', fontWeight: 600 }}>conexões de plataforma</Link>
          {' '}e complete seu{' '}
          <Link href="/dashboard/perfil" style={{ color: '#9b30ff', textDecoration: 'none', fontWeight: 600 }}>perfil</Link>
          {' '}para começar.
        </span>
      </div>

      <div style={{ padding: isMobile ? '1rem' : '1.4rem 2rem' }}>

        {/* Canal Twitch — info ao vivo */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '0.9rem 1.2rem', marginBottom: '0.8rem' }}>
          {channelErr ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: C.muted }}>
              <span style={{ fontSize: '1rem' }}>📡</span>
              <span>{channelErr} — </span>
              <Link href="/dashboard/conexoes" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Conectar Twitch</Link>
            </div>
          ) : !channel ? (
            <div style={{ fontSize: '0.78rem', color: C.vdim }}>Carregando dados do canal...</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {channel.is_live ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', letterSpacing: '0.4px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4444', animation: 'sk-pulse 1.5s ease-in-out infinite', display: 'inline-block' }} />
                    AO VIVO
                  </span>
                ) : (
                  <span style={{ fontSize: '0.68rem', color: C.vdim, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>OFFLINE</span>
                )}
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#9147ff' }}>{channel.broadcaster_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: C.text }}>{channel.follower_count !== null ? fmtNum(channel.follower_count) : '—'}</div>
                  <div style={{ fontSize: '0.63rem', color: C.vdim }}>Seguidores</div>
                </div>
                {channel.is_live && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ff4444' }}>{fmtNum(channel.viewer_count)}</div>
                    <div style={{ fontSize: '0.63rem', color: C.vdim }}>Viewers</div>
                  </div>
                )}
                {channel.view_count !== null && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: C.text }}>{fmtNum(channel.view_count)}</div>
                    <div style={{ fontSize: '0.63rem', color: C.vdim }}>Views totais</div>
                  </div>
                )}
                {channel.game_name && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.text }}>{channel.game_name}</div>
                    <div style={{ fontSize: '0.63rem', color: C.vdim }}>Jogo</div>
                  </div>
                )}
                {channel.title && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>{channel.title}</div>
                    <div style={{ fontSize: '0.63rem', color: C.vdim }}>Título da stream</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cabeçalho + período */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.1rem' }}>
          <h2 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 600, color: C.text }}>Bot da Live — painel de controle</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              {PERIODS.map(([p, label]) => (
                <button key={p} onClick={() => setPeriod(p)} style={{ padding: '0.28rem 0.85rem', borderRadius: '6px', border: 'none', background: p === period ? C.primaryBg : 'transparent', color: p === period ? C.primary : C.dim, fontSize: '0.77rem', fontWeight: p === period ? 700 : 400, cursor: 'pointer', transition: 'all 0.08s', outline: p === period ? `1px solid rgba(155,48,255,0.3)` : 'none', outlineOffset: '-1px' }}>
                  {label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(155,48,255,0.25)', borderRadius: '6px', color: C.text, fontSize: '0.77rem', padding: '0.28rem 0.6rem', outline: 'none', colorScheme: 'dark' }}
                />
                <span style={{ fontSize: '0.72rem', color: C.dim }}>até</span>
                <input
                  type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} min={customFrom}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(155,48,255,0.25)', borderRadius: '6px', color: C.text, fontSize: '0.77rem', padding: '0.28rem 0.6rem', outline: 'none', colorScheme: 'dark' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Total arrecadado */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1rem 1.4rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: C.primary, fontSize: '0.8rem' }}>↗</span>
              Total arrecadado — todas as plataformas
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>{statsLoading ? '...' : fmtBRL((stats?.livepix_total ?? 0) + (stats?.twitch_total ?? 0))}</div>
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {PLAT_TOTALS.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: p.color, fontSize: '0.95rem' }}>{p.sym}</span>
                <div>
                  <div style={{ fontSize: '0.65rem', color: C.vdim }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: C.muted, fontWeight: 600 }}>
                    {p.name === 'Livepix' ? fmtBRL(stats?.livepix_total ?? 0) : p.name === 'Twitch' ? fmtBRL(stats?.twitch_total ?? 0) : 'R$ 0,00'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid 4×2 */}
        {(() => {
          const live = stats
          const statCards = [
            { label: 'Tickets ativos',  value: live ? String(live.tickets_total)     : '0',   sub: 'em circulação',  badge: false },
            { label: 'Participantes',   value: live ? String(live.participants)       : '0',   sub: 'únicos',         badge: false },
            { label: 'Total Livepix',   value: live ? fmtBRL(live.livepix_total)     : 'R$ 0,00', sub: 'no período', badge: true  },
            { label: 'Doadores',        value: live ? String(live.livepix_donors)    : '0',   sub: 'no período',     badge: true  },
            { label: 'Subs Twitch',     value: live ? String(live.twitch_subs)       : '0',   sub: 'no período',     badge: false },
            { label: 'Tickets Twitch',  value: live ? String(live.twitch_tickets)    : '0',   sub: 'gerados',        badge: false },
            { label: 'Únicos Livepix',  value: live ? String(live.livepix_unique)    : '0',   sub: 'doadores',       badge: false },
            { label: 'Total geral',     value: live ? fmtBRL(live.livepix_total)     : 'R$ 0,00', sub: 'arrecadado', badge: false },
          ]
          return (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '0.65rem', marginBottom: '0.65rem' }}>
              {statCards.map(s => (
                <div key={s.label} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '10px', padding: '0.9rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: '0.7rem', color: C.muted, lineHeight: 1.3 }}>{s.label}</div>
                    {s.badge && <span style={{ fontSize: '0.5rem', fontWeight: 700, padding: '0.08rem 0.38rem', background: 'rgba(59,130,246,0.16)', color: '#60a5fa', borderRadius: '999px', flexShrink: 0 }}>NOVO</span>}
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{statsLoading ? '...' : s.value}</div>
                  <div style={{ fontSize: '0.67rem', color: C.vdim, marginTop: '0.18rem' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Nota rodapé */}
        <div style={{ fontSize: '0.69rem', color: C.vdim, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          Livepix, PayPal e subs filtrados por: <strong style={{ color: C.dim }}>{periodLabel}</strong>
          <span style={{ opacity: 0.3 }}>·</span>
          Tickets e participantes refletem o sorteio/período completo
        </div>

        {/* Estimativa de repasse + Receita líquida */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Estimativa de repasse</div>
            {(() => {
              const values: Record<string, number> = { Livepix: stats?.livepix_total ?? 0, Twitch: stats?.twitch_total ?? 0 }
              const maxVal = Math.max(...REPASSE.map(r => values[r.label] ?? 0), 0.01)
              return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.62rem' }}>
              {REPASSE.map(r => {
                const raw = values[r.label] ?? 0
                const net = raw * r.pct / 100
                const barPct = (raw / maxVal) * 100
                return (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '54px', fontSize: '0.75rem', color: raw > 0 ? C.muted : C.vdim, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.color, flexShrink: 0, display: 'inline-block', opacity: raw > 0 ? 1 : 0.3 }} />
                    {r.label}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: raw > 0 ? C.dim : C.vdim, width: '50px' }}>{fmtBRL(raw)}</div>
                  <div style={{ fontSize: '0.74rem', color: raw > 0 ? C.text : C.vdim, fontWeight: raw > 0 ? 700 : 400, width: '58px' }}>→ {fmtBRL(net)}</div>
                  <div style={{ fontSize: '0.7rem', color: C.vdim, width: '28px' }}>{r.pct}%</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barPct}%`, background: r.color, borderRadius: '2px', opacity: raw > 0 ? 0.85 : 0.12, boxShadow: raw > 0 ? `0 0 6px ${r.color}80` : 'none', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.63rem', color: C.vdim, minWidth: '76px', textAlign: 'right' }}>{r.note}</div>
                </div>
              )})}
            </div>
              )
            })()}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: C.primary }}>↗</span> Receita líquida por plataforma
            </div>
            {(() => {
              const livepixNet = (stats?.livepix_total ?? 0) * 0.95
              const twitchNet = (stats?.twitch_total ?? 0) * 0.50
              const allPlats = [
                { label: 'Livepix', color: '#ff69b4', value: livepixNet },
                { label: 'Twitch',  color: '#9147ff', value: twitchNet },
                { label: 'YouTube', color: '#ff4444', value: 0 },
              ]
              const total = allPlats.reduce((s, p) => s + p.value, 0)
              const r = 46, cx = 58, cy = 58
              const circ = 2 * Math.PI * r
              let acc = 0
              const segs = allPlats.map(p => {
                const arc = total > 0 ? (p.value / total) * circ : 0
                const s = { ...p, arc, off: acc }
                acc += arc
                return s
              })
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <svg width={116} height={116} style={{ flexShrink: 0 }}>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={15} />
                    <g transform={`rotate(-90 ${cx} ${cy})`}>
                      {total > 0 && segs.filter(s => s.value > 0).map(s => (
                        <circle key={s.label} cx={cx} cy={cy} r={r}
                          fill="none" stroke={s.color} strokeWidth={15}
                          strokeDasharray={`${s.arc} ${circ}`}
                          strokeDashoffset={-s.off}
                        />
                      ))}
                    </g>
                    {total > 0 ? (
                      <>
                        <text x={cx} y={cx - 5} textAnchor="middle" fill="#e8e6f8" fontSize="10" fontWeight="800" fontFamily="inherit">{fmtBRL(total)}</text>
                        <text x={cx} y={cx + 9} textAnchor="middle" fill="rgba(232,230,248,0.3)" fontSize="8.5" fontFamily="inherit">líquido</text>
                      </>
                    ) : (
                      <text x={cx} y={cx + 4} textAnchor="middle" fill="rgba(232,230,248,0.15)" fontSize="9" fontFamily="inherit">R$ 0,00</text>
                    )}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                    {allPlats.map(p => (
                      <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, opacity: p.value > 0 ? 1 : 0.2 }} />
                        <span style={{ fontSize: '0.75rem', color: p.value > 0 ? C.muted : C.vdim, flex: 1 }}>{p.label}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.value > 0 ? C.text : C.vdim }}>{fmtBRL(p.value)}</span>
                        <span style={{ fontSize: '0.68rem', color: C.vdim, minWidth: 30, textAlign: 'right' }}>
                          {total > 0 ? `${Math.round(p.value / total * 100)}%` : '—'}
                        </span>
                      </div>
                    ))}
                    {total === 0 && (
                      <div style={{ fontSize: '0.72rem', color: C.vdim, marginTop: '0.2rem' }}>Sincronize o Livepix para ver dados</div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Arrecadação no período */}
        {(() => {
          const PLAT_COLOR: Record<string, string> = { livepix: '#ff69b4', twitch: '#9147ff', kick: '#53fc18', paypal: '#009cde' }
          const TYPE_LABEL: Record<string, string> = { donation: 'doou', sub: 'se inscreveu', resub: 'reinscreveu', giftsub: 'presenteou', bits: 'enviou bits', follow: 'seguiu' }
          const monetary = (activities ?? []).filter(a => a.amount && a.amount > 0)
          return (
            <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem', marginBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: C.primary }}>↗</span> Arrecadação no período
              </div>
              {monetary.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: C.vdim, fontSize: '0.82rem' }}>Nenhuma arrecadação no período</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {monetary.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.32rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: PLAT_COLOR[a.platform] ?? C.vdim, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: '0.76rem', fontWeight: 600, color: C.text, flex: 1 }}>{a.username}</span>
                      <span style={{ fontSize: '0.68rem', color: C.vdim }}>{a.created_at.slice(0, 10)}</span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: PLAT_COLOR[a.platform] ?? C.text }}>{fmtBRL(a.amount!)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Sorteios ativos + Atividade recente */}
        {(() => {
          const PLAT_COLOR: Record<string, string> = { livepix: '#ff69b4', twitch: '#9147ff', kick: '#53fc18', paypal: '#009cde' }
          const TYPE_LABEL: Record<string, string> = { donation: 'doou', sub: 'se inscreveu', resub: 'reinscreveu', giftsub: 'presenteou', bits: 'enviou bits', follow: 'seguiu' }
          return (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sorteios ativos</div>
                  <Link href="/dashboard/sorteios/novo" style={{ fontSize: '0.75rem', color: C.primary, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>+ Criar sorteio</Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: C.vdim }}>Nenhum sorteio ativo</div>
                  <Link href="/dashboard/sorteios/novo" style={{ fontSize: '0.78rem', color: C.primary, textDecoration: 'none', background: C.primaryBg, padding: '0.35rem 1rem', borderRadius: '6px', fontWeight: 600 }}>Criar primeiro sorteio</Link>
                </div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Atividade recente</div>
                {!activities || activities.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: C.vdim, fontSize: '0.82rem' }}>Nenhuma atividade registrada</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {activities.slice(0, 6).map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: PLAT_COLOR[a.platform] ?? C.vdim, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: '0.76rem', color: C.muted, flex: 1 }}>
                          <strong style={{ color: C.text }}>{a.username}</strong> {TYPE_LABEL[a.type] ?? a.type}
                        </span>
                        {a.amount ? <span style={{ fontSize: '0.76rem', fontWeight: 700, color: PLAT_COLOR[a.platform] ?? C.text }}>{fmtBRL(a.amount)}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* Top contribuidores */}
        {(() => {
          const PLAT_COLOR: Record<string, string> = { livepix: '#ff69b4', twitch: '#9147ff', kick: '#53fc18', paypal: '#009cde' }
          const totals: Record<string, { username: string; total: number; platform: string }> = {}
          ;(activities ?? []).filter(a => a.amount && a.amount > 0).forEach(a => {
            const k = a.username.toLowerCase()
            if (!totals[k]) totals[k] = { username: a.username, total: 0, platform: a.platform }
            totals[k].total += a.amount!
          })
          const ranked = Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 5)
          return (
            <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                🏆 Top contribuidores
              </div>
              {ranked.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', color: C.vdim, fontSize: '0.82rem' }}>Nenhum contribuidor no período</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {ranked.map((d, i) => (
                    <div key={d.username} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, width: '20px', flexShrink: 0, color: i === 0 ? '#fbbf24' : i === 1 ? 'rgba(192,192,192,0.8)' : i === 2 ? '#b45309' : C.vdim }}>#{i + 1}</span>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: PLAT_COLOR[d.platform] ?? C.vdim, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: C.text, flex: 1 }}>{d.username}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: PLAT_COLOR[d.platform] ?? C.text }}>{fmtBRL(d.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

      </div>
    </div>
  )
}
