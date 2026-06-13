import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PLATFORM_COLORS: Record<string, string> = {
  Twitch: '#9b30ff', Kick: '#22c55e', YouTube: '#ef4444', TikTok: '#e8e6f8',
}

type AgendaItem = {
  id: string; title: string; day_of_week: number; start_time: string
  duration_min: number; platforms: string[]; is_recurring: boolean; is_active: boolean
}

type Profile = {
  userId: string; displayName: string; username: string
  profileImage: string | null; description: string | null
  isLive: boolean; streamTitle: string | null; streamGame: string | null; viewerCount: number
  agenda: AgendaItem[]
}

async function fetchProfile(username: string): Promise<Profile | null> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/public/${username}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function generateMetadata(
  { params }: { params: { username: string } }
): Promise<Metadata> {
  const p = await fetchProfile(params.username)
  if (!p) return { title: 'Streamer não encontrado — SheikSTREAM' }
  return {
    title: `${p.displayName} — SheikSTREAM`,
    description: p.description || `Perfil de ${p.displayName} no SheikSTREAM`,
    openGraph: {
      title: p.displayName,
      description: p.description || `Perfil de ${p.displayName}`,
      images: p.profileImage ? [p.profileImage] : [],
    },
  }
}

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const profile = await fetchProfile(params.username)
  if (!profile) notFound()

  const { displayName, profileImage, description, isLive, streamTitle, streamGame, viewerCount, agenda } = profile

  // Group agenda by day
  const byDay: Record<number, AgendaItem[]> = {}
  for (const item of agenda) {
    if (!byDay[item.day_of_week]) byDay[item.day_of_week] = []
    byDay[item.day_of_week].push(item)
  }

  const hasSchedule = agenda.length > 0

  return (
    <div style={{ minHeight: '100vh', background: '#08090d', color: '#e8e6f8', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header bar */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: '1.1rem', textDecoration: 'none', color: '#e8e6f8' }}>
          <span style={{ color: '#9b30ff' }}>Sheik</span>STREAM
        </Link>
        <Link href="/login" style={{ fontSize: '0.8rem', color: 'rgba(232,230,248,0.55)', textDecoration: 'none' }}>
          Entrar
        </Link>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Profile header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 36 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImage}
                alt={displayName}
                width={96}
                height={96}
                style={{ borderRadius: '50%', border: isLive ? '3px solid #9b30ff' : '3px solid rgba(255,255,255,0.1)', display: 'block' }}
              />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(155,48,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: '3px solid rgba(255,255,255,0.1)' }}>
                🎮
              </div>
            )}
            {isLive && (
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                background: '#ef4444', color: '#fff', fontWeight: 900, fontSize: '0.62rem',
                padding: '2px 6px', borderRadius: 6, border: '2px solid #08090d',
                letterSpacing: '0.08em',
              }}>
                LIVE
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#e8e6f8' }}>
                {displayName}
              </h1>
              {isLive && (
                <span style={{
                  background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                  padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  AO VIVO — {viewerCount.toLocaleString('pt-BR')} viewers
                </span>
              )}
            </div>
            <div style={{ color: 'rgba(232,230,248,0.45)', fontSize: '0.875rem', marginTop: 4 }}>
              twitch.tv/{displayName.toLowerCase()}
            </div>
            {isLive && streamTitle && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: '#111219', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' }}>
                <div style={{ fontSize: '0.78rem', color: 'rgba(232,230,248,0.4)', marginBottom: 3 }}>
                  Ao vivo agora
                </div>
                <div style={{ fontWeight: 600, color: '#e8e6f8', fontSize: '0.9rem' }}>{streamTitle}</div>
                {streamGame && <div style={{ color: '#9b30ff', fontSize: '0.8rem', marginTop: 2 }}>{streamGame}</div>}
              </div>
            )}
            {description && !isLive && (
              <p style={{ color: 'rgba(232,230,248,0.65)', fontSize: '0.875rem', margin: '10px 0 0', lineHeight: 1.6, maxWidth: 480 }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Twitch link CTA */}
        <a
          href={`https://twitch.tv/${displayName.toLowerCase()}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '11px 22px', background: isLive ? 'rgba(239,68,68,0.15)' : 'rgba(145,71,255,0.15)',
            color: isLive ? '#ef4444' : '#9b30ff',
            border: `1px solid ${isLive ? 'rgba(239,68,68,0.3)' : 'rgba(145,71,255,0.3)'}`,
            borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
            marginBottom: 36,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 28" fill="currentColor">
            <path d="M2.149 0L0 5.573V23.33h5.996V28l4.998-4.67H14.8L24 14.497V0H2.149zm19.851 13.63l-3.996 3.734h-4.998L9.008 21.1v-3.736H4.01V2.8h18v10.83zm-3.996-6.994H16v6.23h2.004v-6.23zm-5.998 0H10v6.23h2.006v-6.23z"/>
          </svg>
          {isLive ? 'Assistir ao vivo' : 'Ver canal na Twitch'}
        </a>

        {/* Schedule */}
        {hasSchedule && (
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e8e6f8', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Agenda de Lives
            </h2>

            {/* Day grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 16 }}>
              {DAY_LABELS.map((day, i) => {
                const items = byDay[i] ?? []
                const active = items.length > 0
                return (
                  <div key={i} style={{
                    background: active ? 'rgba(155,48,255,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(155,48,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: active ? '#9b30ff' : 'rgba(232,230,248,0.3)', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {day}
                    </div>
                    {items.map(it => (
                      <div key={it.id} style={{ fontSize: '0.7rem', color: '#e8e6f8', fontWeight: 600, marginBottom: 2 }}>
                        {it.start_time.slice(0, 5)}
                      </div>
                    ))}
                    {!active && <div style={{ width: 6, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 1, margin: '0 auto' }} />}
                  </div>
                )
              })}
            </div>

            {/* Agenda detail list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agenda.map(item => (
                <div key={item.id} style={{
                  background: '#111219', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    background: 'rgba(155,48,255,0.15)', borderRadius: 8,
                    padding: '6px 10px', textAlign: 'center', minWidth: 52, flexShrink: 0,
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9b30ff' }}>
                      {DAY_LABELS[item.day_of_week]}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#e8e6f8', lineHeight: 1 }}>
                      {item.start_time.slice(0, 5)}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#e8e6f8', fontSize: '0.9rem' }}>{item.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                      {item.platforms.map(p => (
                        <span key={p} style={{
                          fontSize: '0.7rem', fontWeight: 600,
                          color: PLATFORM_COLORS[p] || '#e8e6f8',
                          background: `${PLATFORM_COLORS[p] || '#e8e6f8'}18`,
                          border: `1px solid ${PLATFORM_COLORS[p] || '#e8e6f8'}30`,
                          padding: '2px 8px', borderRadius: 5,
                        }}>{p}</span>
                      ))}
                      <span style={{ fontSize: '0.7rem', color: 'rgba(232,230,248,0.35)' }}>
                        {Math.floor(item.duration_min / 60)}h{item.duration_min % 60 > 0 ? `${item.duration_min % 60}min` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>
    </div>
  )
}
