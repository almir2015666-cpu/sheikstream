'use client'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

const PLATS = [
  {
    id: 'twitch', label: 'Twitch', color: '#9147ff', bg: 'rgba(145,71,255,0.1)',
    desc: 'Sorteios de subs, alertas de follow, cheers e bits',
    features: ['Sorteios de Subs', 'Gifted Subs', 'Bits/Cheers', 'Follows', 'Raids'],
    href: '/dashboard/plataformas/twitch', badge: 'Conectado',
  },
  {
    id: 'youtube', label: 'YouTube', color: '#ff0000', bg: 'rgba(255,0,0,0.08)',
    desc: 'Membros, super chats e alertas de inscrição',
    features: ['Membros', 'Super Chats', 'Super Thanks', 'Inscrições', 'Estreias'],
    href: '/dashboard/plataformas/youtube', badge: null,
  },
  {
    id: 'kick', label: 'Kick', color: '#53fc18', bg: 'rgba(83,252,24,0.07)',
    desc: 'Subs, gifted subs e integração com chat da live',
    features: ['Subs', 'Gifted Subs', 'Clips', 'Follows', 'Raids'],
    href: '/dashboard/plataformas/kick', badge: null,
  },
  {
    id: 'tiktok', label: 'TikTok', color: '#69c9d0', bg: 'rgba(105,201,208,0.08)',
    desc: 'Gifts, inscrições e alertas do LIVE',
    features: ['Gifts', 'Likes', 'Inscrições', 'LIVE diamonds', 'Comentários'],
    href: '/dashboard/plataformas/tiktok', badge: null,
  },
  {
    id: 'livepix', label: 'Livepix', color: '#ff69b4', bg: 'rgba(255,105,180,0.08)',
    desc: 'Doações, histórico de transações e integração com sorteios',
    features: ['Doações recebidas', 'Histórico', 'Sorteios', 'Vaquinhas'],
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
            <div style={{ background: C.card, border: `1px solid ${p.badge ? p.color + '30' : C.cardB}`, borderRadius: '14px', padding: '1.4rem', cursor: 'pointer', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: p.bg, border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 900, color: p.color }}>{p.label[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text, marginBottom: '0.2rem' }}>{p.label}</div>
                    <div style={{ fontSize: '0.77rem', color: C.dim }}>{p.desc}</div>
                  </div>
                </div>
                {p.badge ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.25)', color: C.accent, fontSize: '0.68rem', fontWeight: 700, padding: '0.22rem 0.65rem', borderRadius: '999px', flexShrink: 0 }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
                    {p.badge}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.72rem', color: C.vdim, padding: '0.22rem 0.65rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '999px', flexShrink: 0 }}>
                    Não conectado
                  </div>
                )}
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
