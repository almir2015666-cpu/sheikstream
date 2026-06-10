'use client'

const G = {
  bg: '#f9fafb', doc: '#ffffff', text: '#111827', muted: '#6b7280', dim: '#9ca3af',
  border: '#e5e7eb', borderStrong: '#d1d5db', accent: '#9b30ff',
  accentLight: 'rgba(155,48,255,0.08)', heading: '#0f172a',
}

const css = `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  body { margin: 0; }
  .sk-logo-link { transition: opacity 0.1s; }
  .sk-logo-link:hover { opacity: 0.8; }
  @media (max-width: 640px) {
    .sk-doc-grid { grid-template-columns: 1fr !important; }
  }
`

export type LegalSection = {
  id: string
  title: string
  content?: string[]
  items?: { term: string; def: string }[]
  proibido?: string[]
  highlight?: string
}

type Props = {
  title: string
  subtitle?: string
  version?: string
  updatedAt?: string
  badge?: string
  sections: LegalSection[]
  backHref?: string
  backLabel?: string
}

export default function LegalDoc({
  title, subtitle, version = '1.0', updatedAt = '7 de junho de 2026',
  badge = 'Documento Legal', sections, backHref = '/', backLabel = 'Voltar',
}: Props) {
  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: G.bg, minHeight: '100vh', color: G.text }}>
      <style>{css}</style>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: '#ffffff', borderBottom: `1px solid ${G.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 2rem' }}>
        <a href="/" className="sk-logo-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg,#9b30ff,#6b1fc2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: G.heading, letterSpacing: '0.2px' }}>
            Sheik<span style={{ color: G.accent }}>STREAM</span>
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <span style={{ fontSize: '0.78rem', background: G.accentLight, border: `1px solid rgba(155,48,255,0.15)`, padding: '0.22rem 0.75rem', borderRadius: '999px', fontWeight: 600, color: G.accent }}>
            Beta Fechado
          </span>
          <a href={backHref} style={{ fontSize: '0.82rem', color: G.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            {backLabel}
          </a>
        </div>
      </nav>

      {/* Document */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        {/* Header */}
        <div style={{ borderBottom: `2px solid ${G.heading}`, paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-block', background: G.accentLight, border: `1px solid rgba(155,48,255,0.2)`, color: G.accent, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.2px', padding: '0.25rem 0.85rem', borderRadius: '4px', marginBottom: '1rem', textTransform: 'uppercase' }}>
            {badge}
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: G.heading, margin: '0 0 0.75rem', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '1rem', color: G.muted, margin: '0 0 0.75rem', lineHeight: 1.6 }}>{subtitle}</p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.82rem', color: G.muted }}>
            <span><strong style={{ color: G.text }}>Versão:</strong> {version}</span>
            <span><strong style={{ color: G.text }}>Última atualização:</strong> {updatedAt}</span>
            <span><strong style={{ color: G.text }}>Vigência:</strong> imediata</span>
          </div>
        </div>

        {/* TOC */}
        <div style={{ background: '#f3f4f6', border: `1px solid ${G.border}`, borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', color: G.muted, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Sumário</div>
          <div className="sk-doc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.3rem 1.5rem' }}>
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{ fontSize: '0.82rem', color: G.accent, textDecoration: 'none', lineHeight: 1.7 }}>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        {sections.map(s => (
          <section key={s.id} id={s.id} style={{ marginBottom: '2.5rem', scrollMarginTop: '80px' }}>
            <h2 style={{ fontSize: '1.12rem', fontWeight: 800, color: G.heading, margin: '0 0 1rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${G.border}` }}>
              {s.title}
            </h2>

            {s.highlight && (
              <div style={{ background: G.accentLight, border: `1px solid rgba(155,48,255,0.2)`, borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.88rem', color: G.text, lineHeight: 1.7 }}>
                {s.highlight}
              </div>
            )}

            {s.content?.map((p, i) => (
              <p key={i} style={{ fontSize: '0.9rem', color: G.text, lineHeight: 1.85, margin: '0 0 0.9rem' }}>{p}</p>
            ))}

            {s.items && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.9rem' }}>
                {s.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    <span style={{ fontWeight: 700, color: G.heading, minWidth: '160px', flexShrink: 0 }}>{it.term}:</span>
                    <span style={{ color: G.text }}>{it.def}</span>
                  </div>
                ))}
              </div>
            )}

            {s.proibido && (
              <>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: G.heading, margin: '1rem 0 0.5rem' }}>É expressamente proibido:</p>
                <ul style={{ margin: '0 0 0.9rem', paddingLeft: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {s.proibido.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.9rem', color: G.text, lineHeight: 1.7 }}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ))}

        {/* Footer */}
        <div style={{ borderTop: `2px solid ${G.heading}`, paddingTop: '1.5rem', marginTop: '1rem', fontSize: '0.82rem', color: G.muted, lineHeight: 1.8 }}>
          <strong style={{ color: G.text }}>SheikSTREAM</strong> — Plataforma de gestão para streamers brasileiros.<br />
          Versão {version} · São Paulo, Brasil · 2026
        </div>
      </div>
    </div>
  )
}
