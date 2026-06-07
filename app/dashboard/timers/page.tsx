'use client'
import { useState, useEffect, useRef } from 'react'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 1rem', background: '#08090d', border: '1px solid rgba(155,48,255,0.22)', borderRadius: '8px', color: '#e8e6f8', fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: '0.76rem', fontWeight: 600, color: 'rgba(232,230,248,0.55)', marginBottom: '0.38rem', display: 'block' }

type Timer = { nome: string; duracao: number; restante: number; ativo: boolean; mensagem: string }

function fmt(s: number) {
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const ss = s % 60
  return `${h ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export default function TimersPage() {
  const [timers, setTimers] = useState<Timer[]>([
    { nome: 'Intervalo de hydrate', duracao: 1800, restante: 1800, ativo: false, mensagem: 'Hora de se hidratar! 💧' },
    { nome: 'Divulgar Discord', duracao: 3600, restante: 3600, ativo: false, mensagem: 'Entre no Discord: discord.gg/...' },
  ])
  const [form, setForm] = useState({ nome: '', duracao: '30', mensagem: '' })
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
      setTimers(p => [...p, { nome: form.nome, duracao: d, restante: d, ativo: false, mensagem: form.mensagem }])
      setForm({ nome: '', duracao: '30', mensagem: '' })
      setCreating(false)
    }
  }

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.1rem', fontWeight: 800 }}>Timers</h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: C.dim }}>Lembretes automáticos enviados no chat em intervalos definidos</p>
        </div>
        <button onClick={() => setCreating(true)} style={{ padding: '0.5rem 1.2rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
          + Novo timer
        </button>
      </div>

      {creating && (
        <div style={{ background: C.card, border: '1px solid rgba(155,48,255,0.25)', borderRadius: '12px', padding: '1.3rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '1rem' }}>Novo Timer</div>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.85rem' }}>
            <div>
              <label style={labelStyle}>Nome do timer</label>
              <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Intervalo de água" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Intervalo (min)</label>
              <input type="number" value={form.duracao} onChange={e => setForm(p => ({ ...p, duracao: e.target.value }))} min={1} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Mensagem no chat</label>
              <input value={form.mensagem} onChange={e => setForm(p => ({ ...p, mensagem: e.target.value }))} placeholder="Mensagem enviada quando o timer disparar..." style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: '0.5rem 1.1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: C.dim, borderRadius: '8px', fontSize: '0.83rem', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" style={{ padding: '0.5rem 1.3rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer' }}>Criar</button>
            </div>
          </form>
        </div>
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
