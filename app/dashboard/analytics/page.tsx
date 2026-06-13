'use client'
import { useEffect, useState } from 'react'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.4)',
  vdim: 'rgba(232,230,248,0.2)', primary: '#9b30ff',
  border: 'rgba(255,255,255,0.07)', accent: '#39ff14',
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

type HeatData = {
  heat: Record<string, number>
  weeklyTotals: number[]
  categoryCount: Record<string, number>
  peakDow: number | null
  peakHour: number | null
  peakCount: number
  subCount: number
  donationCount: number
  totalEvents: number
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function AnalyticsPage() {
  const [data, setData] = useState<HeatData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/heatmap')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const maxHeat = data ? Math.max(1, ...Object.values(data.heat)) : 1
  const maxWeekly = data ? Math.max(1, ...data.weeklyTotals) : 1

  function cellColor(count: number): string {
    if (!count) return 'rgba(255,255,255,0.04)'
    const intensity = count / maxHeat
    const r = Math.round(155 + 100 * intensity)
    const g = Math.round(48 * (1 - intensity))
    const b = Math.round(255 - 80 * intensity)
    return `rgba(${r},${g},${b},${0.2 + 0.8 * intensity})`
  }

  const statCard = (label: string, value: string | number, sub?: string, color?: string) => (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: S.dim, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color: color || S.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: S.vdim, marginTop: 6 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ color: S.text, fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px' }}>Analytics</h1>
      <p style={{ color: S.muted, fontSize: '0.875rem', margin: '0 0 28px' }}>
        Relatório de atividade dos últimos 90 dias
      </p>

      {loading ? (
        <div style={{ color: S.dim, fontSize: '0.875rem', padding: '40px 0', textAlign: 'center' }}>Carregando dados...</div>
      ) : !data ? (
        <div style={{ color: S.dim, fontSize: '0.875rem', padding: '40px 0', textAlign: 'center' }}>Sem dados suficientes ainda.</div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
            {statCard('Eventos (90 dias)', data.totalEvents.toLocaleString('pt-BR'), 'atividades registradas', S.primary)}
            {statCard('Subs (30 dias)', data.subCount.toLocaleString('pt-BR'), 'inscrições Twitch')}
            {statCard('Doações (30 dias)', data.donationCount.toLocaleString('pt-BR'), 'via Livepix')}
            {data.peakDow !== null && data.peakHour !== null
              ? statCard('Horário de pico', `${DAY_LABELS[data.peakDow]} ${pad(data.peakHour)}h`, `${data.peakCount} eventos nesse horário`, S.accent)
              : statCard('Horário de pico', '—', 'dados insuficientes')
            }
          </div>

          {/* Heatmap */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '20px 20px 16px', marginBottom: 24 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: S.text, marginBottom: 16 }}>
              Heatmap de atividade por dia e hora
            </div>

            {/* Hour labels */}
            <div style={{ display: 'flex', marginLeft: 36, marginBottom: 4 }}>
              {HOURS.filter(h => h % 3 === 0).map(h => (
                <div key={h} style={{ flex: '3 0 0', fontSize: '0.62rem', color: S.vdim, textAlign: 'center' }}>
                  {pad(h)}h
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {[0, 1, 2, 3, 4, 5, 6].map(dow => (
              <div key={dow} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                <div style={{ width: 32, fontSize: '0.68rem', fontWeight: 600, color: S.dim, flexShrink: 0 }}>
                  {DAY_LABELS[dow]}
                </div>
                <div style={{ display: 'flex', flex: 1, gap: 2 }}>
                  {HOURS.map(hour => {
                    const count = data.heat[`${dow}:${hour}`] ?? 0
                    return (
                      <div
                        key={hour}
                        title={`${DAY_LABELS[dow]} ${pad(hour)}h — ${count} evento${count !== 1 ? 's' : ''}`}
                        style={{
                          flex: 1, height: 18, borderRadius: 3,
                          background: cellColor(count),
                          transition: 'transform 0.1s',
                          cursor: count > 0 ? 'default' : 'default',
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.68rem', color: S.vdim }}>Menos</span>
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map(v => (
                <div key={v} style={{ width: 14, height: 14, borderRadius: 3, background: cellColor(v * maxHeat) }} />
              ))}
              <span style={{ fontSize: '0.68rem', color: S.vdim }}>Mais</span>
            </div>
          </div>

          {/* Weekly bar chart */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '20px 20px 16px', marginBottom: 24 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: S.text, marginBottom: 16 }}>
              Atividade semanal (últimas 12 semanas)
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
              {data.weeklyTotals.slice(0, 12).reverse().map((count, i) => {
                const h = Math.round((count / maxWeekly) * 80)
                const isCurrentWeek = i === data.weeklyTotals.length - 1
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: '0.6rem', color: S.vdim }}>{count || ''}</div>
                    <div style={{
                      width: '100%', height: Math.max(h, count > 0 ? 4 : 2),
                      background: isCurrentWeek ? S.primary : 'rgba(155,48,255,0.35)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                    }} />
                    <div style={{ fontSize: '0.6rem', color: S.vdim, whiteSpace: 'nowrap' }}>
                      {i === data.weeklyTotals.length - 1 ? 'Atual' : `${data.weeklyTotals.length - 1 - i}s`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category breakdown */}
          {Object.keys(data.categoryCount).length > 0 && (
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '20px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: S.text, marginBottom: 16 }}>
                Tipos de atividade
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(data.categoryCount)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => {
                    const pct = Math.round((count / data.totalEvents) * 100)
                    return (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 80, fontSize: '0.78rem', color: S.muted, fontWeight: 600, flexShrink: 0, textTransform: 'capitalize' }}>{cat}</div>
                        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: S.primary, borderRadius: 4, transition: 'width 0.5s' }} />
                        </div>
                        <div style={{ width: 44, fontSize: '0.75rem', color: S.dim, textAlign: 'right', flexShrink: 0 }}>{pct}%</div>
                        <div style={{ width: 36, fontSize: '0.75rem', color: S.vdim, textAlign: 'right', flexShrink: 0 }}>{count}</div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
