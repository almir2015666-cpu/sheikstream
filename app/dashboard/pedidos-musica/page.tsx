'use client'
import { useEffect, useState, useCallback, useRef } from 'react'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.45)',
  vdim: 'rgba(232,230,248,0.28)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  border: 'rgba(255,255,255,0.06)', borderP: 'rgba(155,48,255,0.2)',
  red: '#ef4444', green: '#22c55e', yellow: '#f59e0b',
  spotify: '#1DB954', spotifyBg: 'rgba(29,185,84,0.1)', spotifyBorder: 'rgba(29,185,84,0.2)',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${S.border}`,
  borderRadius: '8px', color: S.text, fontSize: '0.875rem',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

const lbl: React.CSSProperties = {
  fontSize: '0.73rem', fontWeight: 600,
  color: 'rgba(232,230,248,0.5)',
  marginBottom: '0.3rem', display: 'block',
  textTransform: 'uppercase', letterSpacing: '0.4px',
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? S.green : 'rgba(255,255,255,0.12)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
    </button>
  )
}

type SongRequest = {
  id: string; requester: string; title: string; artist: string
  spotify_url: string; duration_ms: number; thumbnail: string
  status: 'pending' | 'playing' | 'played' | 'skipped'; position: number; created_at: string
}

type Config = {
  enabled: boolean; command: string; max_queue: number
  allow_duplicates: boolean; announce_chat: boolean; cooldown_s: number
}

type NowPlaying = {
  title: string; artist: string; thumbnail: string
  progress_ms: number; duration_ms: number; is_playing: boolean
} | null

type SearchTrack = { uri: string; title: string; artist: string; duration_ms: number; thumbnail: string }

function fmtDur(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function SpotifyConnectOverlay({ onConnected }: { onConnected: () => void }) {
  const [connecting, setConnecting] = useState(false)
  const popupRef = useRef<Window | null>(null)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'spotify_connected') {
        popupRef.current?.close()
        setConnecting(false)
        onConnected()
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onConnected])

  const openPopup = () => {
    setConnecting(true)
    const w = 500, h = 640
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2)
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2)
    const popup = window.open(
      '/api/auth/spotify?popup=1',
      'spotify_oauth',
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
    )
    popupRef.current = popup
    if (!popup) { setConnecting(false); return }
    const poll = setInterval(() => {
      if (popup.closed) { clearInterval(poll); setConnecting(false) }
    }, 500)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(8,9,13,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: S.card, border: `1px solid ${S.border}`,
        borderRadius: '20px', padding: '2.5rem 2rem',
        textAlign: 'center', maxWidth: '400px', width: '90%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Spotify icon */}
        <div style={{ marginBottom: '1.25rem' }}>
          <svg viewBox="0 0 24 24" width="52" height="52" fill={S.spotify} style={{ display: 'block', margin: '0 auto' }}>
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>

        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800, color: S.text }}>
          Conecte o Spotify
        </h2>
        <p style={{ margin: '0 0 1.75rem', fontSize: '0.85rem', color: S.muted, lineHeight: 1.6 }}>
          Para receber pedidos de música no chat e controlar a fila, conecte sua conta do Spotify.
        </p>

        <button onClick={openPopup} disabled={connecting} style={{
          width: '100%', padding: '0.8rem 1.5rem',
          background: connecting ? 'rgba(29,185,84,0.4)' : S.spotify,
          border: 'none', borderRadius: '10px',
          color: '#000', fontWeight: 800, fontSize: '0.95rem',
          cursor: connecting ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          transition: 'opacity 0.15s',
        }}>
          {connecting ? (
            <>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(0,0,0,0.4)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Aguardando autorização...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#000"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              Conectar com Spotify
            </>
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function PedidosMusicaPage() {
  const [queue, setQueue] = useState<SongRequest[]>([])
  const [cfg, setCfg] = useState<Config>({ enabled: true, command: 'sr', max_queue: 20, allow_duplicates: false, announce_chat: true, cooldown_s: 60 })
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [tab, setTab] = useState<'fila' | 'config'>('fila')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [spotifyConnected, setSpotifyConnected] = useState(false)

  const loadAll = useCallback(async () => {
    const [qRes, cfgRes, npRes, tokRes] = await Promise.all([
      fetch('/api/song-requests').then(r => r.ok ? r.json() : []),
      fetch('/api/song-requests/config').then(r => r.ok ? r.json() : null),
      fetch('/api/spotify/now-playing').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/tokens/status').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
    setQueue(qRes ?? [])
    if (cfgRes) setCfg(cfgRes)
    setNowPlaying(npRes)
    setSpotifyConnected(!!tokRes?.spotify)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
    const iv = setInterval(loadAll, 5000)
    return () => clearInterval(iv)
  }, [loadAll])

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`)
      if (res.ok) setSearchResults(await res.json())
    } finally { setSearching(false) }
  }

  const handleAdd = async (track: SearchTrack) => {
    setAdding(track.uri)
    try {
      await fetch('/api/song-requests/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': 'sheikstream-internal-2024' },
        body: JSON.stringify({ broadcaster_id: 'me', requester: 'streamer', query: `${track.title} ${track.artist}` }),
      })
      setSearch(''); setSearchResults([])
      await loadAll()
    } finally { setAdding(null) }
  }

  const handleRemove = async (id: string) => {
    await fetch(`/api/song-requests?id=${id}`, { method: 'DELETE' })
    setQueue(q => q.filter(i => i.id !== id))
  }

  const handleClear = async () => {
    if (!confirm('Limpar toda a fila?')) return
    await fetch('/api/song-requests?mode=all', { method: 'DELETE' })
    await loadAll()
  }

  const handleSkip = async () => {
    setSkipping(true)
    await fetch('/api/song-requests/skip', { method: 'POST' }).finally(() => setSkipping(false))
    await loadAll()
  }

  const handleMarkPlaying = async (id: string) => {
    await fetch('/api/song-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'playing' }) })
    await loadAll()
  }

  const saveCfg = async () => {
    setSaving(true)
    await fetch('/api/song-requests/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) }).finally(() => setSaving(false))
  }

  const playing = queue.find(q => q.status === 'playing')
  const pending = queue.filter(q => q.status === 'pending')

  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontSize: '0.9rem' }}>
      Carregando...
    </div>
  )

  return (
    <div style={{ background: S.bg, minHeight: '100vh', padding: '2rem 3rem', color: S.text, fontFamily: "-apple-system,'Inter',system-ui,sans-serif", position: 'relative' }}>
      <style>{`
        input:focus, textarea:focus, select:focus { outline: none; border-color: rgba(155,48,255,0.5) !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(155,48,255,0.2); border-radius: 2px; }
      `}</style>

      {/* Spotify connect overlay — shown when not connected */}
      {!spotifyConnected && !loading && (
        <SpotifyConnectOverlay onConnected={loadAll} />
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: S.text }}>Pedidos de Música</h1>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: '99px', border: '1px solid rgba(59,130,246,0.25)', letterSpacing: '0.3px' }}>NOVO</span>
          {spotifyConnected && (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.55rem', background: S.spotifyBg, color: S.spotify, borderRadius: '99px', border: `1px solid ${S.spotifyBorder}`, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <svg viewBox="0 0 24 24" width="10" height="10" fill={S.spotify}><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              Spotify conectado
            </span>
          )}
        </div>
        <p style={{ margin: 0, color: S.muted, fontSize: '0.82rem' }}>
          Viewers pedem músicas via{' '}
          <code style={{ background: S.primaryBg, padding: '0 4px', borderRadius: '4px', fontSize: '0.8rem', color: S.primary }}>!{cfg.command}</code>
          {' '}no chat — integração com Spotify
        </p>
      </div>

      {/* Now playing */}
      {nowPlaying?.is_playing && (
        <div style={{ background: S.spotifyBg, border: `1px solid ${S.spotifyBorder}`, borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {nowPlaying.thumbnail && (
            <img src={nowPlaying.thumbnail} alt="" style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: S.spotify, letterSpacing: '0.5px', marginBottom: '0.2rem', textTransform: 'uppercase' }}>▶ Tocando agora</div>
            <div style={{ fontSize: '0.93rem', fontWeight: 700, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nowPlaying.title}</div>
            <div style={{ fontSize: '0.78rem', color: S.muted }}>{nowPlaying.artist}</div>
            <div style={{ marginTop: '0.5rem', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: S.spotify, width: `${(nowPlaying.progress_ms / nowPlaying.duration_ms) * 100}%`, borderRadius: '99px', transition: 'width 3s linear' }} />
            </div>
          </div>
          <button onClick={handleSkip} disabled={skipping}
            style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: '8px', color: S.muted, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, opacity: skipping ? 0.5 : 1 }}>
            ⏭ Skip
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '3px', marginBottom: '1.5rem', width: 'fit-content' }}>
        {(['fila', 'config'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '7px', border: 'none', background: tab === t ? S.primaryBg : 'transparent', color: tab === t ? S.primary : S.muted, fontWeight: tab === t ? 700 : 500, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s' }}>
            {t === 'fila' ? `🎵 Fila${pending.length > 0 ? ` (${pending.length})` : ''}` : '⚙ Config'}
          </button>
        ))}
      </div>

      {tab === 'fila' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Search */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '1.5rem 2rem' }}>
            <div style={{ ...lbl, marginBottom: '0.65rem' }}>Adicionar manualmente</div>
            <div style={{ position: 'relative' }}>
              <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Buscar música ou artista no Spotify..." style={inp} />
              {search && (
                <button onClick={() => { setSearch(''); setSearchResults([]) }} style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: S.dim, cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, padding: 0 }}>✕</button>
              )}
            </div>
            {searching && <p style={{ margin: '0.6rem 0 0', fontSize: '0.78rem', color: S.muted }}>Buscando...</p>}
            {searchResults.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {searchResults.map(r => (
                  <div key={r.uri} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.025)', border: `1px solid ${S.border}`, borderRadius: '8px' }}>
                    {r.thumbnail && <img src={r.thumbnail} alt="" style={{ width: '38px', height: '38px', borderRadius: '5px', objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div style={{ fontSize: '0.73rem', color: S.muted }}>{r.artist} · {fmtDur(r.duration_ms)}</div>
                    </div>
                    <button onClick={() => handleAdd(r)} disabled={adding === r.uri}
                      style={{ padding: '0.35rem 0.85rem', background: S.primaryBg, border: `1px solid ${S.borderP}`, borderRadius: '6px', color: S.primary, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0, opacity: adding === r.uri ? 0.6 : 1 }}>
                      {adding === r.uri ? '...' : '+ Fila'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Queue */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 2rem', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.87rem', color: S.text }}>Fila de pedidos</span>
              {queue.length > 0 && (
                <button onClick={handleClear} style={{ background: 'transparent', border: 'none', color: S.dim, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Limpar tudo</button>
              )}
            </div>

            {playing && (
              <div style={{ padding: '1rem 2rem', background: 'rgba(29,185,84,0.04)', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, background: S.spotifyBg, color: S.spotify, padding: '0.15rem 0.5rem', borderRadius: '99px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Tocando</span>
                {playing.thumbnail && <img src={playing.thumbnail} alt="" style={{ width: '32px', height: '32px', borderRadius: '5px', objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playing.title}</div>
                  <div style={{ fontSize: '0.73rem', color: S.muted }}>por @{playing.requester} · {playing.artist}</div>
                </div>
                <button onClick={handleSkip} style={{ padding: '0.3rem 0.7rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: '6px', color: S.dim, cursor: 'pointer', fontSize: '0.78rem' }}>⏭</button>
              </div>
            )}

            {pending.length === 0 && !playing ? (
              <div style={{ padding: '3.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem', opacity: 0.35 }}>🎵</div>
                <div style={{ fontSize: '0.83rem', color: S.muted }}>Nenhum pedido na fila</div>
                <div style={{ fontSize: '0.75rem', color: S.dim, marginTop: '0.25rem' }}>
                  Viewers podem usar{' '}
                  <code style={{ color: S.primary, background: S.primaryBg, padding: '0 3px', borderRadius: '3px' }}>!{cfg.command}</code>
                  {' '}no chat
                </div>
              </div>
            ) : (
              pending.map((item, idx) => (
                <div key={item.id} style={{ padding: '1rem 2rem', borderBottom: idx < pending.length - 1 ? `1px solid ${S.border}` : 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.73rem', color: S.vdim, width: '22px', textAlign: 'center', flexShrink: 0, fontWeight: 600 }}>#{idx + 1}</span>
                  {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: '34px', height: '34px', borderRadius: '5px', objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: '0.73rem', color: S.muted }}>@{item.requester} · {item.artist} · {fmtDur(item.duration_ms)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                    <button onClick={() => handleMarkPlaying(item.id)} title="Marcar como tocando"
                      style={{ padding: '0.3rem 0.7rem', background: S.spotifyBg, border: `1px solid ${S.spotifyBorder}`, borderRadius: '6px', color: S.spotify, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>▶</button>
                    {item.spotify_url && (
                      <a href={item.spotify_url} target="_blank" rel="noopener noreferrer" title="Abrir no Spotify"
                        style={{ padding: '0.3rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, borderRadius: '6px', color: S.dim, fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>↗</a>
                    )}
                    <button onClick={() => handleRemove(item.id)} title="Remover"
                      style={{ padding: '0.3rem 0.7rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', fontSize: '0.78rem' }}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '2rem 2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Enable */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: S.text, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Pedidos de música ativado</div>
                  <div style={{ fontSize: '0.78rem', color: S.muted }}>Viewers podem pedir músicas pelo chat</div>
                </div>
                <Toggle on={cfg.enabled} onChange={v => setCfg(c => ({ ...c, enabled: v }))} />
              </div>

              <div style={{ height: '1px', background: S.border }} />

              {/* Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                {([
                  { key: 'command', label: 'Comando do chat', prefix: '!' },
                  { key: 'cooldown_s', label: 'Cooldown (segundos)', type: 'number' },
                  { key: 'max_queue', label: 'Tamanho máx. da fila', type: 'number' },
                ] as { key: string; label: string; prefix?: string; type?: string }[]).map(({ key, label, prefix, type = 'text' }) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {prefix && <span style={{ color: S.muted, fontSize: '0.9rem', flexShrink: 0 }}>{prefix}</span>}
                      <input type={type} value={(cfg as Record<string, unknown>)[key] as string}
                        onChange={e => setCfg(c => ({ ...c, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                        style={{ ...inp, flex: 1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {([
                  { key: 'allow_duplicates', label: 'Permitir músicas duplicadas na fila' },
                  { key: 'announce_chat', label: 'Anunciar no chat quando música é adicionada' },
                ] as { key: string; label: string }[]).map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={(cfg as Record<string, unknown>)[key] as boolean}
                      onChange={e => setCfg(c => ({ ...c, [key]: e.target.checked }))}
                      style={{ width: '15px', height: '15px', accentColor: S.primary, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '0.85rem', color: S.text }}>{label}</span>
                  </label>
                ))}
              </div>

              <button onClick={saveCfg} disabled={saving}
                style={{ padding: '0.65rem 1.5rem', background: saving ? 'rgba(255,255,255,0.05)' : S.primary, border: 'none', borderRadius: '8px', color: saving ? S.muted : '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </div>
          </div>

          {/* Overlay URL */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '1.5rem 2rem' }}>
            <div style={lbl}>URL do Overlay (OBS Browser Source)</div>
            <code style={{ fontSize: '0.78rem', color: S.muted, wordBreak: 'break-all', display: 'block', lineHeight: 1.7, marginBottom: '0.5rem' }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/overlay/song-request?uid=SEU_ID` : '/overlay/song-request?uid=SEU_ID'}
            </code>
            <div style={{ fontSize: '0.73rem', color: S.dim }}>
              Parâmetros: <code style={{ color: S.primary }}>theme=light</code> · <code style={{ color: S.primary }}>next=0</code> (ocultar próxima música)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
