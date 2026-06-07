'use client'
import { useState } from 'react'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 1rem', background: '#08090d', border: '1px solid rgba(155,48,255,0.22)', borderRadius: '8px', color: '#e8e6f8', fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: '0.76rem', fontWeight: 600, color: 'rgba(232,230,248,0.55)', marginBottom: '0.38rem', display: 'block' }

type Cmd = { trigger: string; resposta: string; cooldown: string; habilitado: boolean }

const DEFAULTS: Cmd[] = [
  { trigger: '!sorteio', resposta: 'O sorteio atual é: $titulo — Participe em $link', cooldown: '30', habilitado: true },
  { trigger: '!meta', resposta: 'Meta atual: $atual/$alvo ($pct%)', cooldown: '20', habilitado: true },
  { trigger: '!discord', resposta: 'Entre no nosso Discord: https://discord.gg/...', cooldown: '60', habilitado: false },
]

export default function ComandosPage() {
  const [cmds, setCmds] = useState<Cmd[]>(DEFAULTS)
  const [form, setForm] = useState<Cmd>({ trigger: '!', resposta: '', cooldown: '30', habilitado: true })
  const [creating, setCreating] = useState(false)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (form.trigger.length > 1 && form.resposta) {
      setCmds(p => [...p, form])
      setForm({ trigger: '!', resposta: '', cooldown: '30', habilitado: true })
      setCreating(false)
    }
  }

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.1rem', fontWeight: 800 }}>Comandos do Chat</h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: C.dim }}>Comandos respondidos automaticamente no chat da live</p>
        </div>
        <button onClick={() => setCreating(true)} style={{ padding: '0.5rem 1.2rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
          + Novo comando
        </button>
      </div>

      {creating && (
        <div style={{ background: C.card, border: '1px solid rgba(155,48,255,0.25)', borderRadius: '12px', padding: '1.3rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '1rem' }}>Novo Comando</div>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Gatilho (trigger)</label>
                <input value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value }))} placeholder="!comando" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Resposta</label>
                <input value={form.resposta} onChange={e => setForm(p => ({ ...p, resposta: e.target.value }))} placeholder="Mensagem enviada no chat..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Cooldown (s)</label>
                <input type="number" value={form.cooldown} onChange={e => setForm(p => ({ ...p, cooldown: e.target.value }))} min={0} style={inputStyle} />
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: C.dim }}>Variáveis: <span style={{ color: C.primary }}>$titulo $atual $alvo $pct $user $link</span></div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: '0.5rem 1.1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: C.dim, borderRadius: '8px', fontSize: '0.83rem', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" style={{ padding: '0.5rem 1.3rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer' }}>Criar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 90px 80px 90px', gap: '1rem', padding: '0.7rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.72rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
          <span>Trigger</span><span>Resposta</span><span>Cooldown</span><span>Status</span><span></span>
        </div>
        {cmds.map((cmd, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 90px 80px 90px', gap: '1rem', padding: '0.85rem 1.2rem', borderBottom: i < cmds.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', alignItems: 'center' }}>
            <code style={{ fontSize: '0.83rem', color: C.primary, fontFamily: 'monospace', fontWeight: 700 }}>{cmd.trigger}</code>
            <span style={{ fontSize: '0.82rem', color: C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd.resposta}</span>
            <span style={{ fontSize: '0.8rem', color: C.dim }}>{cmd.cooldown}s</span>
            <div onClick={() => setCmds(p => p.map((c, idx) => idx === i ? { ...c, habilitado: !c.habilitado } : c))} style={{ width: '34px', height: '18px', borderRadius: '999px', background: cmd.habilitado ? C.primary : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.15s' }}>
              <div style={{ position: 'absolute', top: '2px', left: cmd.habilitado ? '18px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
            </div>
            <button onClick={() => setCmds(p => p.filter((_, idx) => idx !== i))} style={{ padding: '0.3rem 0.7rem', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6b6b', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
              Remover
            </button>
          </div>
        ))}
        {cmds.length === 0 && (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', fontSize: '0.85rem', color: C.dim }}>Nenhum comando criado</div>
        )}
      </div>
    </div>
  )
}
