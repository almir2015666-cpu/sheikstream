'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const C = {
  card: '#111219',
  cardB: 'rgba(255,255,255,0.055)',
  text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.48)',
  dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.15)',
  primary: '#9b30ff',
  primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

type Period = '7d' | '30d' | '90d' | 'custom'

const PERIODS: [Period, string][] = [['7d','7 dias'],['30d','30 dias'],['90d','90 dias'],['custom','Personalizado']]

const PLAT_TOTALS = [
  { sym: '♥', color: '#ff4d6d' },
  { sym: '◈', color: '#9147ff' },
  { sym: '▶', color: '#ff0000' },
  { sym: '⊡', color: '#53fc18' },
  { sym: '♪', color: '#69c9d0' },
  { sym: '⊞', color: '#009cde' },
]

const STATS = [
  { label: 'Tickets ativos',   value: '0',      sub: 'em circulação' },
  { label: 'Participantes',    value: '0',      sub: 'únicos' },
  { label: 'Total Livepix',    value: 'R$ 0,00', sub: 'no período', badge: true },
  { label: 'Total PayPal',     value: 'R$ 0,00', sub: 'no período', badge: true },
  { label: 'Subs Twitch',      value: '0',      sub: 'no período' },
  { label: 'Membros YouTube',  value: '0',      sub: 'no período' },
  { label: 'Subs Kick',        value: '0',      sub: 'no período' },
  { label: 'Subs TikTok',      value: '0',      sub: 'no período' },
]

const REPASSE = [
  { label: 'Livepix', color: '#ff4d6d', pct: '95%', note: 'pago em R$' },
  { label: 'Twitch',  color: '#9147ff', pct: '50%', note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'YouTube', color: '#ff0000', pct: '70%', note: 'U$ 0,00 · 0,0% de U$100' },
  { label: 'Kick',    color: '#53fc18', pct: '50%', note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'TikTok',  color: '#69c9d0', pct: '50%', note: 'U$ 0,00 · 0,0% de U$50' },
  { label: 'PayPal',  color: '#009cde', pct: '97%', note: 'pago em R$' },
]

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const { data: session } = useSession()

  const periodLabel = PERIODS.find(([p]) => p === period)?.[1] ?? '30 dias'

  return (
    <div style={{ minHeight: '100vh', background: '#08090d', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* ── Banner de boas-vindas ── */}
      <div style={{ background: 'linear-gradient(90deg,rgba(155,48,255,0.1),rgba(57,255,20,0.04))', borderBottom: '1px solid rgba(155,48,255,0.15)', padding: '0.55rem 2rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
        <span style={{ fontSize: '1rem' }}>🚀</span>
        <span style={{ fontSize: '0.81rem', color: '#a78bfa', fontWeight: 600 }}>Bem-vindo ao Beta!</span>
        <span style={{ fontSize: '0.81rem', color: C.dim }}>Configure suas{' '}
          <Link href="/dashboard/conexoes" style={{ color: '#9b30ff', textDecoration: 'none' }}>conexões de plataforma</Link>
          {' '}e complete seu{' '}
          <Link href="/dashboard/perfil" style={{ color: '#9b30ff', textDecoration: 'none' }}>perfil</Link>
          {' '}para começar.
        </span>
      </div>

      <div style={{ padding: '1.4rem 2rem' }}>

        {/* ── Cabeçalho + seletor de período ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <h1 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 600, color: C.text }}>Bot da Live — painel de controle</h1>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {PERIODS.map(([p, label]) => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '0.28rem 0.75rem', borderRadius: '6px', border: p === period ? '1px solid rgba(155,48,255,0.3)' : '1px solid transparent', background: p === period ? C.primaryBg : 'transparent', color: p === period ? C.primary : C.dim, fontSize: '0.77rem', fontWeight: p === period ? 600 : 400, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Total arrecadado ── */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1rem 1.4rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: C.dim, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: C.primary }}>↗</span>
              Total arrecadado — todas as plataformas
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>R$ 0,00</div>
          </div>
          <div style={{ display: 'flex', gap: '1.1rem', flexWrap: 'wrap' }}>
            {PLAT_TOTALS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ color: p.color, fontSize: '0.9rem' }}>{p.sym}</span>
                <span style={{ fontSize: '0.78rem', color: C.muted }}>R$ 0,00</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats grid 4×2 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.7rem', marginBottom: '0.6rem' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '10px', padding: '0.9rem 1.05rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <div style={{ fontSize: '0.72rem', color: C.muted, lineHeight: 1.3 }}>{s.label}</div>
                {s.badge && <span style={{ fontSize: '0.52rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: '999px', flexShrink: 0 }}>NOVO</span>}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginTop: '0.18rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Nota de rodapé das stats ── */}
        <div style={{ fontSize: '0.7rem', color: C.vdim, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Livepix, PayPal e subs filtrados por: <strong style={{ color: C.dim }}>{periodLabel}</strong></span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>Tickets e participantes refletem o sorteio/período completo</span>
        </div>

        {/* ── Estimativa de repasse + Receita líquida ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>

          {/* Estimativa de repasse */}
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.9rem' }}>Estimativa de repasse</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.58rem' }}>
              {REPASSE.map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '60px', fontSize: '0.76rem', color: C.muted, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.color, flexShrink: 0, display: 'inline-block' }} />
                    {r.label}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: C.dim, width: '46px' }}>R$ 0,00</div>
                  <div style={{ fontSize: '0.78rem', color: C.text, fontWeight: 600, width: '55px' }}>→ R$ <b>0,00</b></div>
                  <div style={{ fontSize: '0.74rem', color: C.dim, width: '30px' }}>{r.pct}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }} />
                  </div>
                  <div style={{ fontSize: '0.66rem', color: C.dim, minWidth: '70px', textAlign: 'right' }}>{r.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Receita líquida */}
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: C.primary }}>↗</span> Receita líquida por plataforma
              </div>
              <span style={{ fontSize: '0.68rem', color: C.vdim }}>repasse estimado</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px', color: C.vdim }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem', opacity: 0.25 }}>↗</div>
                <div style={{ fontSize: '0.8rem' }}>Sem receita registrada ainda</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Arrecadação no período ── */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: C.primary }}>↗</span> Arrecadação no período
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: C.vdim }}>
            <div style={{ fontSize: '0.8rem' }}>Nenhuma arrecadação no período</div>
          </div>
        </div>

      </div>
    </div>
  )
}
