'use client'
import { useState } from 'react'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.08)',
}

const MOCK = [
  { nome: 'CaféGamer', email: 'cafe@gmail.com', sorteio: 'Meta Dezembro', tickets: 5, status: 'pendente' },
  { nome: 'LunaPlay', email: 'luna@outlook.com', sorteio: 'Subathon Verão', tickets: 12, status: 'aprovado' },
  { nome: 'DragonXBR', email: 'dragon@gmail.com', sorteio: 'Meta Dezembro', tickets: 3, status: 'pendente' },
  { nome: 'PixelNova', email: 'pixel@hotmail.com', sorteio: 'Meta Dezembro', tickets: 8, status: 'rejeitado' },
]

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pendente:  { label: 'Pendente',  bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24' },
  aprovado:  { label: 'Aprovado',  bg: 'rgba(57,255,20,0.08)',  color: '#39ff14' },
  rejeitado: { label: 'Rejeitado', bg: 'rgba(255,68,68,0.08)',  color: '#ff6b6b' },
}

export default function ConvitesPage() {
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const conviteLink = 'https://sheikstream.vercel.app/convite/abc123'

  function copyLink() {
    navigator.clipboard.writeText(conviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = MOCK.filter(c =>
    !search || c.nome.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800 }}>Convites</h2>
        <p style={{ margin: 0, fontSize: '0.84rem', color: C.dim }}>Gerencie participantes convidados para sorteios exclusivos</p>
      </div>

      {/* Link de convite */}
      <div style={{ background: C.card, border: `1px solid rgba(155,48,255,0.2)`, borderRadius: '12px', padding: '1.2rem 1.4rem', marginBottom: '1.2rem' }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Link de convite exclusivo</div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div style={{ flex: 1, background: '#08090d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.82rem', color: C.vdim, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conviteLink}
          </div>
          <button onClick={copyLink} style={{ padding: '0.5rem 1.2rem', background: copied ? accentBg : C.primaryBg, border: `1px solid ${copied ? 'rgba(57,255,20,0.3)' : 'rgba(155,48,255,0.3)'}`, color: copied ? C.accent : C.primary, borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            {copied ? '✓ Copiado!' : 'Copiar link'}
          </button>
          <button style={{ padding: '0.5rem 1.2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: C.dim, borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
            Gerar novo
          </button>
        </div>
      </div>

      {/* Busca */}
      <div style={{ marginBottom: '1rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail..." style={{ width: '280px', padding: '0.6rem 1rem', background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '8px', color: C.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Tabela */}
      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 90px 120px', gap: '1rem', padding: '0.7rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.72rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
          <span>Participante</span><span>Sorteio</span><span>E-mail</span><span>Tickets</span><span>Status</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', fontSize: '0.85rem', color: C.dim }}>Nenhum convite encontrado</div>
        ) : filtered.map((c, i) => {
          const s = STATUS_MAP[c.status]
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 90px 120px', gap: '1rem', padding: '0.85rem 1.2rem', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '0.87rem', color: C.text }}>{c.nome}</div>
              <div style={{ fontSize: '0.82rem', color: C.dim }}>{c.sorteio}</div>
              <div style={{ fontSize: '0.78rem', color: C.dim }}>{c.email}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: C.primary }}>{c.tickets}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.22rem 0.65rem', background: s.bg, color: s.color, borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const accentBg = 'rgba(57,255,20,0.08)'
