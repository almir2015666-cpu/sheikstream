'use client'
import { useState, useEffect } from 'react'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 1rem', background: '#08090d', border: '1px solid rgba(155,48,255,0.22)', borderRadius: '8px', color: '#e8e6f8', fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: '0.76rem', fontWeight: 600, color: 'rgba(232,230,248,0.55)', marginBottom: '0.38rem', display: 'block' }

export default function PerfilPage() {
  const [user, setUser] = useState<{ id: string; name: string; email: string; image: string } | null>(null)
  const [form, setForm] = useState({ nome: '', email: '', bio: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (u) {
          setUser(u)
          setForm({ nome: u.name || '', email: u.email || '', bio: '' })
        }
      })
      .catch(() => {})
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Meu Perfil</h2>

      <div style={{ maxWidth: '600px' }}>

        {/* Avatar */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          {user?.image ? (
            <img src={user.image} alt="" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(155,48,255,0.3)' }} />
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: C.primaryBg, border: '3px solid rgba(155,48,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: C.primary, fontWeight: 900 }}>
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text, marginBottom: '0.25rem' }}>{user?.name || 'Carregando...'}</div>
            <div style={{ fontSize: '0.78rem', color: C.dim, marginBottom: '0.5rem' }}>{user?.email || ''}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(155,48,255,0.12)', border: '1px solid rgba(155,48,255,0.25)', color: C.primary, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '999px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.primary, display: 'inline-block' }} />
              Conectado via Twitch
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ padding: '0.85rem 1.3rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.76rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            Informações do perfil
          </div>
          <form onSubmit={handleSave} style={{ padding: '1.3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Nome de exibição</label>
              <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Seu nome ou nome do canal" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="seu@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Bio do canal</label>
              <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Fale um pouco sobre seu canal..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={{ padding: '0.55rem 1.5rem', background: saved ? 'rgba(57,255,20,0.15)' : C.primary, border: saved ? '1px solid rgba(57,255,20,0.3)' : 'none', color: saved ? C.accent : '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                {saved ? '✓ Salvo!' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>

        {/* Zona de perigo */}
        <div style={{ background: C.card, border: '1px solid rgba(255,68,68,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.3rem', borderBottom: '1px solid rgba(255,68,68,0.1)', fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,107,107,0.7)', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            Zona de perigo
          </div>
          <div style={{ padding: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: C.text }}>Sair da conta</div>
              <div style={{ fontSize: '0.75rem', color: C.dim }}>Você precisará fazer login novamente</div>
            </div>
            <button onClick={() => { window.location.href = '/api/logout' }} style={{ padding: '0.42rem 1rem', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: '#ff6b6b', borderRadius: '7px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
              Sair
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
