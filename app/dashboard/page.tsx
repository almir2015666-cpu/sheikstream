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
  { label: 'Livepix', color: '#ff4d6d', pct: 95, note: 'pago em R$' },
  { label: 'Twitch',  color: '#9147ff', pct: 50, note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'YouTube', color: '#ff0000', pct: 70, note: 'U$ 0,00 · 0,0% de U$100' },
  { label: 'Kick',    color: '#53fc18', pct: 50, note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'TikTok',  color: '#69c9d0', pct: 50, note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'PayPal',  color: '#009cde', pct: 97, note: 'pago em R$' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function daysAgoStr(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [customFrom, setCustomFrom] = useState(daysAgoStr(30))
  const [customTo, setCustomTo] = useState(todayStr())
  const [isMobile, setIsMobile] = useState(false)
  const periodLabel = PERIODS.find(([p]) => p === period)?.[1] ?? '30 dias'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
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
            <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>R$ 0,00</div>
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {PLAT_TOTALS.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: p.color, fontSize: '0.95rem' }}>{p.sym}</span>
                <div>
                  <div style={{ fontSize: '0.65rem', color: C.vdim }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: C.muted, fontWeight: 600 }}>R$ 0,00</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid 4×2 */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '0.65rem', marginBottom: '0.65rem' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '10px', padding: '0.9rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ fontSize: '0.7rem', color: C.muted, lineHeight: 1.3 }}>{s.label}</div>
                {s.badge && <span style={{ fontSize: '0.5rem', fontWeight: 700, padding: '0.08rem 0.38rem', background: 'rgba(59,130,246,0.16)', color: '#60a5fa', borderRadius: '999px', flexShrink: 0 }}>NOVO</span>}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: '0.67rem', color: C.vdim, marginTop: '0.18rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.62rem' }}>
              {REPASSE.map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '58px', fontSize: '0.75rem', color: C.muted, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.color, flexShrink: 0, display: 'inline-block' }} />
                    {r.label}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: C.dim, width: '48px' }}>R$ 0,00</div>
                  <div style={{ fontSize: '0.74rem', color: C.text, fontWeight: 600, width: '56px' }}>→ R$ 0,00</div>
                  <div style={{ fontSize: '0.7rem', color: C.dim, width: '32px' }}>{r.pct}%</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${r.pct}%`, background: r.color, borderRadius: '2px', opacity: 0.35 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.64rem', color: C.vdim, minWidth: '78px', textAlign: 'right' }}>{r.note}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: C.primary }}>↗</span> Receita líquida por plataforma
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '130px', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '2.5rem', opacity: 0.1 }}>↗</div>
              <div style={{ fontSize: '0.8rem', color: C.vdim }}>Sem receita registrada ainda</div>
            </div>
          </div>
        </div>

        {/* Arrecadação no período */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem', marginBottom: '0.8rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: C.primary }}>↗</span> Arrecadação no período
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: C.vdim, fontSize: '0.82rem' }}>
            Nenhuma arrecadação no período
          </div>
        </div>

        {/* Sorteios ativos + Atividade recente */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sorteios ativos</div>
              <Link href="/dashboard/sorteios/novo" style={{ fontSize: '0.75rem', color: C.primary, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                + Criar sorteio
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: C.vdim }}>Nenhum sorteio ativo</div>
              <Link href="/dashboard/sorteios/novo" style={{ fontSize: '0.78rem', color: C.primary, textDecoration: 'none', background: C.primaryBg, padding: '0.35rem 1rem', borderRadius: '6px', fontWeight: 600 }}>
                Criar primeiro sorteio
              </Link>
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Atividade recente</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: C.vdim, fontSize: '0.82rem' }}>
              Nenhuma atividade registrada
            </div>
          </div>
        </div>

        {/* Top doadores */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            🏆 Top doadores
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', color: C.vdim, fontSize: '0.82rem' }}>
            Nenhum doador registrado no período
          </div>
        </div>

      </div>
    </div>
  )
}
