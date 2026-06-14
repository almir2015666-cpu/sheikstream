'use client'
import { useEffect, useState, useCallback } from 'react'

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

  useEffect(() => { loadAll(); const iv = setInterval(loadAll, 5000); return () => clearInterval(iv) }, [loadAll])

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

  if (loading) return <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontSize: '0.9rem' }}>Carregando...</div>

  return (
    <div style={{ background: S.bg, minHeight: '100vh', padding: '1.5rem 2rem', color: S.text, fontFamily: "-apple-system,'Inter',system-ui,sans-serif" }}>
      <style>{`
        input:focus, textarea:focus, select:focus { outline: none; border-color: rgba(155,48,255,0.5) !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(155,48,255,0.2); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: S.text }}>Pedidos de Música</h1>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: '99px', border: '1px solid rgba(59,130,246,0.25)', letterSpacing: '0.3px' }}>NOVO</span>
          </div>
          <p style={{ margin: 0, color: S.muted, fontSize: '0.82rem' }}>Viewers pedem músicas via <code style={{ background: 'rgba(155,48,255,0.12)', padding: '0 4px', borderRadius: '4px', fontSize: '0.8rem', color: S.primary }}>!{cfg.command}</code> no chat — integração com Spotify</p>
        </div>
        {!spotifyConnected && (
          <a href="/dashboard/conexoes" style={{ padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: S.red, fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            ⚠ Conectar Spotify
          </a>
        )}
      </div>

      {/* Now playing */}
      {nowPlaying?.is_playing && (
        <div style={{ background: S.spotifyBg, border: `1px solid ${S.spotifyBorder}`, borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          {nowPlaying.thumbnail && <img src={nowPlaying.thumbnail} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: S.spotify, letterSpacing: '0.5px', marginBottom: '0.2rem', textTransform: 'uppercase' }}>▶ Tocando agora</div>
            <div style={{ fontSize: '0.93rem', fontWeight: 700, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nowPlaying.title}</div>
            <div style={{ fontSize: '0.78rem', color: S.muted }}>{nowPlaying.artist}</div>
            <div style={{ marginTop: '0.45rem', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: S.spotify, width: `${(nowPlaying.progress_ms / nowPlaying.duration_ms) * 100}%`, borderRadius: '99px', transition: 'width 3s linear' }} />
            </div>
          </div>
          <button onClick={handleSkip} disabled={skipping}
            style={{ padding: '0.45rem 0.9rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: '8px', color: S.muted, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, opacity: skipping ? 0.5 : 1 }}>
            ⏭ Skip
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '3px', marginBottom: '1.25rem', width: 'fit-content' }}>
        {(['fila', 'config'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '0.45rem 1.1rem', borderRadius: '7px', border: 'none', background: tab === t ? S.primaryBg : 'transparent', color: tab === t ? S.primary : S.muted, fontWeight: tab === t ? 700 : 500, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s' }}>
            {t === 'fila' ? `🎵 Fila${pending.length > 0 ? ` (${pending.length})` : ''}` : '⚙ Config'}
          </button>
        ))}
      </div>

      {tab === 'fila' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '1.1rem 1.25rem' }}>
            <div style={{ ...lbl, marginBottom: '0.6rem' }}>Adicionar manualmente</div>
            <div style={{ position: 'relative' }}>
              <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Buscar música ou artista no Spotify..." style={inp} />
              {search && (
                <button onClick={() => { setSearch(''); setSearchResults([]) }} style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: S.dim, cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, padding: 0 }}>✕</button>
              )}
            </div>
            {searching && <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: S.muted }}>Buscando...</p>}
            {searchResults.length > 0 && (
              <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {searchResults.map(r => (
                  <div key={r.uri} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.025)', border: `1px solid ${S.border}`, borderRadius: '8px' }}>
                    {r.thumbnail && <img src={r.thumbnail} alt="" style={{ width: '36px', height: '36px', borderRadius: '5px', objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div style={{ fontSize: '0.73rem', color: S.muted }}>{r.artist} · {fmtDur(r.duration_ms)}</div>
                    </div>
                    <button onClick={() => handleAdd(r)} disabled={adding === r.uri}
                      style={{ padding: '0.35rem 0.8rem', background: S.primaryBg, border: `1px solid ${S.borderP}`, borderRadius: '6px', color: S.primary, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0, opacity: adding === r.uri ? 0.6 : 1 }}>
                      {adding === r.uri ? '...' : '+ Fila'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Queue */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.87rem', color: S.text }}>Fila de pedidos</span>
              {queue.length > 0 && (
                <button onClick={handleClear} style={{ background: 'transparent', border: 'none', color: S.dim, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Limpar tudo</button>
              )}
            </div>

            {playing && (
              <div style={{ padding: '0.8rem 1.25rem', background: 'rgba(29,185,84,0.04)', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, background: S.spotifyBg, color: S.spotify, padding: '0.15rem 0.5rem', borderRadius: '99px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Tocando</span>
                {playing.thumbnail && <img src={playing.thumbnail} alt="" style={{ width: '32px', height: '32px', borderRadius: '5px', objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playing.title}</div>
                  <div style={{ fontSize: '0.73rem', color: S.muted }}>por @{playing.requester} · {playing.artist}</div>
                </div>
                <button onClick={handleSkip} style={{ padding: '0.3rem 0.65rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: '6px', color: S.dim, cursor: 'pointer', fontSize: '0.78rem' }}>⏭</button>
              </div>
            )}

            {pending.length === 0 && !playing ? (
              <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem', opacity: 0.4 }}>🎵</div>
                <div style={{ fontSize: '0.83rem', color: S.muted }}>Nenhum pedido na fila</div>
                <div style={{ fontSize: '0.75rem', color: S.dim, marginTop: '0.2rem' }}>Viewers podem usar <code style={{ color: S.primary, background: S.primaryBg, padding: '0 3px', borderRadius: '3px' }}>!{cfg.command}</code> no chat</div>
              </div>
            ) : (
              pending.map((item, idx) => (
                <div key={item.id} style={{ padding: '0.75rem 1.25rem', borderBottom: idx < pending.length - 1 ? `1px solid ${S.border}` : 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.73rem', color: S.vdim, width: '22px', textAlign: 'center', flexShrink: 0, fontWeight: 600 }}>#{idx + 1}</span>
                  {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: '32px', height: '32px', borderRadius: '5px', objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: '0.73rem', color: S.muted }}>@{item.requester} · {item.artist} · {fmtDur(item.duration_ms)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => handleMarkPlaying(item.id)} title="Marcar como tocando"
                      style={{ padding: '0.3rem 0.65rem', background: S.spotifyBg, border: `1px solid ${S.spotifyBorder}`, borderRadius: '6px', color: S.spotify, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>▶</button>
                    {item.spotify_url && (
                      <a href={item.spotify_url} target="_blank" rel="noopener noreferrer" title="Abrir no Spotify"
                        style={{ padding: '0.3rem 0.65rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, borderRadius: '6px', color: S.dim, fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>↗</a>
                    )}
                    <button onClick={() => handleRemove(item.id)} title="Remover"
                      style={{ padding: '0.3rem 0.65rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', fontSize: '0.78rem' }}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Enable */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: S.text, fontSize: '0.9rem', marginBottom: '0.15rem' }}>Pedidos de música ativado</div>
                  <div style={{ fontSize: '0.78rem', color: S.muted }}>Viewers podem pedir músicas pelo chat</div>
                </div>
                <Toggle on={cfg.enabled} onChange={v => setCfg(c => ({ ...c, enabled: v }))} />
              </div>

              <div style={{ height: '1px', background: S.border }} />

              {/* Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '1.1rem 1.25rem' }}>
            <div style={lbl}>URL do Overlay (OBS Browser Source)</div>
            <code style={{ fontSize: '0.78rem', color: S.muted, wordBreak: 'break-all', display: 'block', lineHeight: 1.6 }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/overlay/song-request?uid=SEU_ID` : '/overlay/song-request?uid=SEU_ID'}
            </code>
            <div style={{ marginTop: '0.5rem', fontSize: '0.73rem', color: S.dim }}>
              Parâmetros: <code style={{ color: S.primary }}>theme=light</code> · <code style={{ color: S.primary }}>next=0</code> (ocultar próxima música)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
