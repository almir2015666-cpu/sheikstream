'use client'
import { useState } from 'react'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 1rem', background: '#08090d', border: '1px solid rgba(155,48,255,0.22)', borderRadius: '8px', color: '#e8e6f8', fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: '0.76rem', fontWeight: 600, color: 'rgba(232,230,248,0.55)', marginBottom: '0.38rem', display: 'block' }

const TIPOS = ['Valor (R$)', 'Subs Twitch', 'Membros YouTube', 'Subs Kick', 'Subs TikTok', 'Seguidores']

export default function MetasPage() {
  const [form, setForm] = useState({ titulo: '', valorAtual: '', valorAlvo: '', tipo: TIPOS[0] })
  const [metas, setMetas] = useState<typeof form[]>([])
  const [creating, setCreating] = useState(false)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (form.titulo && form.valorAlvo) {
      setMetas(p => [...p, form])
      setForm({ titulo: '', valorAtual: '', valorAlvo: '', tipo: TIPOS[0] })
      setCreating(false)
    }
  }

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Metas</h2>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: 'rgba(59,130,246,0.18)', color: '#60a5fa', borderRadius: '999px', letterSpacing: '0.5px' }}>NOVO</span>
        </div>
        <button onClick={() => setCreating(true)} style={{ padding: '0.5rem 1.2rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
          + Nova meta
        </button>
      </div>

      {/* Formulário de criação */}
      {creating && (
        <div style={{ background: C.card, border: `1px solid rgba(155,48,255,0.25)`, borderRadius: '12px', padding: '1.3rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '1rem' }}>Nova Meta</div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Título *</label>
                <input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Meta de Subs" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Valor atual</label>
                <input value={form.valorAtual} onChange={e => setForm(p => ({ ...p, valorAtual: e.target.value }))} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Valor alvo *</label>
                <input value={form.valorAlvo} onChange={e => setForm(p => ({ ...p, valorAlvo: e.target.value }))} placeholder="Ex: 100" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: '0.5rem 1.1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: C.dim, borderRadius: '8px', fontSize: '0.83rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" style={{ padding: '0.5rem 1.3rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer' }}>
                Criar meta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de metas */}
      {metas.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {metas.map((m, i) => {
            const atual = Number(m.valorAtual) || 0
            const alvo = Number(m.valorAlvo) || 1
            const pct = Math.min(100, Math.round((atual / alvo) * 100))
            return (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: C.text }}>{m.titulo}</div>
                    <div style={{ fontSize: '0.72rem', color: C.dim, marginTop: '0.15rem' }}>{m.tipo}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.accent }}>{atual} / {alvo}</div>
                    <div style={{ fontSize: '0.7rem', color: C.dim }}>{pct}% concluído</div>
                  </div>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`, borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
              </div>
            )
          })}
        </div>
      ) : !creating && (
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>🎯</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: '0.5rem' }}>Nenhuma meta criada</div>
          <div style={{ fontSize: '0.84rem', color: C.dim }}>Crie metas de doação, subs ou seguidores para motivar sua comunidade</div>
        </div>
      )}
    </div>
  )
}
