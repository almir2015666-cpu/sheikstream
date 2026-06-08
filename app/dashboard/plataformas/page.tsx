'use client'

function PlatIcon({ id, color }: { id: string; color: string }) {
  if (id === 'twitch')
    return (
      <svg width="24" height="24" viewBox="0 0 24 28" fill={color}>
        <path d="M2.149 0L0 5.573V23.33h5.996V28l4.998-4.67H14.8L24 14.497V0H2.149zm19.851 13.63l-3.996 3.734h-4.998L9.008 21.1v-3.736H4.01V2.8h18v10.83zm-3.996-6.994H16v6.23h2.004v-6.23zm-5.998 0H10v6.23h2.006v-6.23z"/>
      </svg>
    )
  if (id === 'livepix')
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
      </svg>
    )
  return <span style={{ fontSize: '1.3rem', fontWeight: 900, color }}>{id[0].toUpperCase()}</span>
}

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

const PLATS = [
  {
    id: 'twitch', label: 'Twitch', color: '#9147ff', bg: 'rgba(145,71,255,0.08)',
    desc: 'Gestão de subs, gift subs, repasse Twitch e integração com sorteios',
    features: ['Subs cadastrados', 'Gift subs', 'Estimativa de repasse', 'Ajustar níveis de tier', 'Integração com sorteios'],
    href: '/dashboard/plataformas/twitch', badge: null,
  },
  {
    id: 'livepix', label: 'Livepix', color: '#ff69b4', bg: 'rgba(255,105,180,0.08)',
    desc: 'Doações, histórico de transações e integração com sorteios e metas',
    features: ['Doações recebidas', 'Histórico de transações', 'Integração com sorteios', 'Vaquinhas', 'Metas de doação'],
    href: '/dashboard/conexoes', badge: null,
  },
]

export default function PlataformasPage() {
  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800 }}>Plataformas</h2>
        <p style={{ margin: 0, fontSize: '0.84rem', color: C.dim }}>Configure e gerencie suas plataformas de streaming conectadas</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.9rem' }}>
        {PLATS.map(p => (
          <a key={p.id} href={p.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: C.card, border: `1px solid ${p.badge ? p.color + '30' : C.cardB}`, borderRadius: '14px', padding: '1.4rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: p.bg, border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PlatIcon id={p.id} color={p.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text, marginBottom: '0.2rem' }}>{p.label}</div>
                    <div style={{ fontSize: '0.77rem', color: C.dim }}>{p.desc}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: C.vdim, padding: '0.22rem 0.65rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '999px', flexShrink: 0 }}>
                  Não conectado
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.9rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: C.vdim, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.5rem' }}>Funcionalidades</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {p.features.map(f => (
                    <span key={f} style={{ fontSize: '0.7rem', padding: '0.18rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: C.dim, borderRadius: '5px' }}>{f}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: C.primary }}>Configurar →</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
