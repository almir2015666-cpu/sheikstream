'use client'
import { useState, useEffect, useRef } from 'react'

const C = {
  card: '#0d0f18', cardB: 'rgba(255,255,255,0.07)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.28)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  blue: '#3b82f6', blueBg: 'rgba(59,130,246,0.12)',
  accent: '#39ff14',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem',
  background: '#08090d', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: '#e8e6f8', fontSize: '0.875rem',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem', fontWeight: 700, color: 'rgba(232,230,248,0.38)',
  letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase',
}

type Timer = { nome: string; duracao: number; restante: number; ativo: boolean; mensagem: string }

const PLAT_OPTIONS = [
  { id: 'twitch',  label: 'Twitch' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'kick',    label: 'Kick' },
  { id: 'tiktok',  label: 'TikTok' },
]

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: '44px', height: '24px', borderRadius: '12px',
      background: on ? C.blue : 'rgba(255,255,255,0.1)',
      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: '3px', left: on ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  )
}

function fmt(s: number) {
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const ss = s % 60
  return `${h ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export default function TimersPage() {
  const [timers, setTimers] = useState<Timer[]>([
    { nome: 'Intervalo de hydrate', duracao: 1800, restante: 1800, ativo: false, mensagem: 'Hora de se hidratar! 💧' },
    { nome: 'Divulgar Discord', duracao: 3600, restante: 3600, ativo: false, mensagem: 'Entre no Discord: discord.gg/...' },
  ])
  const [form, setForm] = useState({ nome: '', duracao: '60', mensagem: '', timerAtivo: true, plataformas: [] as string[] })
  const [creating, setCreating] = useState(false)
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    tick.current = setInterval(() => {
      setTimers(p => p.map(t => {
        if (!t.ativo || t.restante <= 0) return t
        const r = t.restante - 1
        return { ...t, restante: r <= 0 ? t.duracao : r }
      }))
    }, 1000)
    return () => { if (tick.current) clearInterval(tick.current) }
  }, [])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (form.nome && form.duracao) {
      const d = Number(form.duracao) * 60
      setTimers(p => [...p, { nome: form.nome, duracao: d, restante: d, ativo: form.timerAtivo, mensagem: form.mensagem }])
      setForm({ nome: '', duracao: '60', mensagem: '', timerAtivo: true, plataformas: [] })
      setCreating(false)
    }
  }

  function togglePlat(id: string) {
    setForm(p => ({
      ...p,
      plataformas: p.plataformas.includes(id) ? p.plataformas.filter(x => x !== id) : [...p.plataformas, id],
    }))
  }

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Timers</h2>
        </div>
        <button onClick={() => setCreating(true)} style={{ padding: '0.5rem 1.1rem', background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>
          + Novo timer
        </button>
      </div>

      {/* Create form modal */}
      {creating && (
        <>
          {/* Backdrop */}
          <div onClick={() => setCreating(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />

          {/* Modal */}
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 50, width: '100%', maxWidth: '540px', background: '#111420', border: `1px solid ${C.cardB}`, borderRadius: '16px', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ padding: '1.1rem 1.4rem', borderBottom: `1px solid ${C.cardB}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Novo Timer</span>
              <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '1.3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Nome */}
              <div>
                <label style={labelStyle}>Nome do timer</label>
                <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Intervalo de água" style={inputStyle} />
              </div>

              {/* Mensagem */}
              <div>
                <label style={labelStyle}>Mensagem no chat</label>
                <textarea value={form.mensagem} onChange={e => setForm(p => ({ ...p, mensagem: e.target.value }))} rows={2} placeholder="Mensagem enviada quando o timer disparar..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Intervalo */}
              <div>
                <label style={labelStyle}>Intervalo (minutos)</label>
                <input type="number" value={form.duracao} onChange={e => setForm(p => ({ ...p, duracao: e.target.value }))} min={1} style={inputStyle} />
              </div>

              {/* Platforms section */}
              <div style={{ borderTop: `1px solid ${C.cardB}`, paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.dim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Enviar no Chat quando ao Vivo
                </div>
                <div style={{ fontSize: '0.76rem', color: C.dim, marginBottom: '0.85rem', lineHeight: 1.5 }}>
                  Escolha em quais plataformas conectadas o timer deve aparecer. Fora da live, o envio fica pausado automaticamente.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {PLAT_OPTIONS.map(pl => {
                    const sel = form.plataformas.includes(pl.id)
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => togglePlat(pl.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.55rem 0.85rem',
                          background: sel ? C.blueBg : '#08090d',
                          border: `1px solid ${sel ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '8px', cursor: 'pointer',
                          color: sel ? C.blue : C.muted,
                          fontSize: '0.82rem', fontWeight: 600,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span>{pl.label}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.74rem', color: sel ? C.blue : C.dim }}>
                          {sel ? (
                            <>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Selecionado
                            </>
                          ) : (
                            <>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                              </svg>
                              Conectar
                            </>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Timer ativo toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.9rem', background: '#08090d', border: `1px solid ${C.cardB}`, borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Timer ativo</div>
                  <div style={{ fontSize: '0.75rem', color: C.dim }}>Enviar mensagens automaticamente</div>
                </div>
                <Toggle on={form.timerAtivo} onChange={v => setForm(p => ({ ...p, timerAtivo: v }))} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button type="button" onClick={() => setCreating(false)} style={{ padding: '0.52rem 1.2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: C.muted, borderRadius: '8px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '0.52rem 1.4rem', background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>
                  Criar
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {timers.map((t, i) => {
          const pct = Math.round(((t.duracao - t.restante) / t.duracao) * 100)
          return (
            <div key={i} style={{ background: C.card, border: `1px solid ${t.ativo ? 'rgba(155,48,255,0.3)' : C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.65rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: C.text }}>{t.nome}</div>
                  {t.mensagem && <div style={{ fontSize: '0.74rem', color: C.dim, marginTop: '0.15rem' }}>{t.mensagem}</div>}
                </div>
                <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900, color: t.ativo ? C.accent : C.text, letterSpacing: '-1px' }}>{fmt(t.restante)}</div>
                  <div style={{ fontSize: '0.7rem', color: C.dim }}>/ {fmt(t.duracao)}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setTimers(p => p.map((tm, idx) => idx === i ? { ...tm, ativo: !tm.ativo } : tm))} style={{ padding: '0.4rem 1rem', background: t.ativo ? 'rgba(57,255,20,0.1)' : C.primaryBg, border: `1px solid ${t.ativo ? 'rgba(57,255,20,0.3)' : 'rgba(155,48,255,0.3)'}`, color: t.ativo ? C.accent : C.primary, borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                    {t.ativo ? 'Pausar' : 'Iniciar'}
                  </button>
                  <button onClick={() => setTimers(p => p.map((tm, idx) => idx === i ? { ...tm, restante: tm.duracao, ativo: false } : tm))} style={{ padding: '0.4rem 0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: C.dim, borderRadius: '7px', fontSize: '0.78rem', cursor: 'pointer' }}>
                    Reset
                  </button>
                  <button onClick={() => setTimers(p => p.filter((_, idx) => idx !== i))} style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,68,68,0.07)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6b6b', borderRadius: '7px', fontSize: '0.78rem', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: t.ativo ? `linear-gradient(90deg, ${C.primary}, ${C.accent})` : 'rgba(255,255,255,0.1)', transition: 'width 1s linear, background 0.3s' }} />
              </div>
            </div>
          )
        })}
        {timers.length === 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>⏱</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: '0.5rem' }}>Nenhum timer criado</div>
            <div style={{ fontSize: '0.84rem', color: C.dim }}>Crie timers para enviar lembretes automáticos no chat</div>
          </div>
        )}
      </div>
    </div>
  )
}
