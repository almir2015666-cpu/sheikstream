'use client'
import { useEffect, useState, useCallback } from 'react'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.45)',
  primary: '#1DB954', primaryBg: 'rgba(29,185,84,0.12)',
  border: 'rgba(255,255,255,0.06)', borderP: 'rgba(29,185,84,0.2)',
  red: '#ef4444', yellow: '#f59e0b', purple: '#9b30ff',
}

type SongRequest = {
  id: string
  requester: string
  title: string
  artist: string
  spotify_uri: string
  spotify_url: string
  duration_ms: number
  thumbnail: string
  status: 'pending' | 'playing' | 'played' | 'skipped'
  position: number
  created_at: string
}

type Config = {
  enabled: boolean
  command: string
  max_queue: number
  allow_duplicates: boolean
  announce_chat: boolean
  cooldown_s: number
}

type NowPlaying = {
  title: string
  artist: string
  thumbnail: string
  progress_ms: number
  duration_ms: number
  is_playing: boolean
} | null

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
  const [searchResults, setSearchResults] = useState<{ uri: string; title: string; artist: string; duration_ms: number; thumbnail: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [spotifyConnected, setSpotifyConnected] = useState(false)

  const loadQueue = useCallback(async () => {
    const [qRes, cfgRes, npRes, tokRes] = await Promise.all([
      fetch('/api/song-requests').then(r => r.ok ? r.json() : []),
      fetch('/api/song-requests/config').then(r => r.ok ? r.json() : null),
      fetch('/api/spotify/now-playing').then(r => r.ok ? r.json() : null),
      fetch('/api/tokens/status').then(r => r.ok ? r.json() : null),
    ])
    setQueue(qRes ?? [])
    if (cfgRes) setCfg(cfgRes)
    setNowPlaying(npRes)
    setSpotifyConnected(!!tokRes?.spotify)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadQueue()
    const iv = setInterval(loadQueue, 5000)
    return () => clearInterval(iv)
  }, [loadQueue])

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(Array.isArray(data) ? data : [])
    } catch { /* ignore */ } finally {
      setSearching(false)
    }
  }

  const handleAddManual = async (track: typeof searchResults[0]) => {
    setAdding(true)
    try {
      await fetch('/api/song-requests/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': 'sheikstream-internal-2024' },
        body: JSON.stringify({ broadcaster_id: 'me', requester: 'streamer', query: `${track.title} ${track.artist}` }),
      })
      setSearch('')
      setSearchResults([])
      await loadQueue()
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    await fetch(`/api/song-requests?id=${id}&mode=`, { method: 'DELETE' })
    await loadQueue()
  }

  const handleClear = async () => {
    if (!confirm('Limpar toda a fila?')) return
    await fetch('/api/song-requests?mode=all', { method: 'DELETE' })
    await loadQueue()
  }

  const handleSkip = async () => {
    setSkipping(true)
    await fetch('/api/song-requests/skip', { method: 'POST' }).finally(() => setSkipping(false))
    await loadQueue()
  }

  const handleMarkPlaying = async (id: string) => {
    await fetch('/api/song-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'playing' }) })
    await loadQueue()
  }

  const saveCfg = async () => {
    setSaving(true)
    await fetch('/api/song-requests/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) }).finally(() => setSaving(false))
  }

  const playing = queue.find(q => q.status === 'playing')
  const pending = queue.filter(q => q.status === 'pending')

  if (loading) return <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted }}>Carregando...</div>

  return (
    <div style={{ background: S.bg, minHeight: '100vh', padding: '1.5rem 2rem', color: S.text }}>
      <style>{`
        input:focus { outline: none; border-color: ${S.primary} !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(29,185,84,0.2); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🎵</span>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Pedidos de Música</h1>
          <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', background: 'rgba(29,185,84,0.15)', color: S.primary, borderRadius: '99px', border: '1px solid rgba(29,185,84,0.3)', fontWeight: 700 }}>NOVO</span>
        </div>
        <p style={{ margin: 0, color: S.muted, fontSize: '0.85rem' }}>Viewers pedem músicas via !{cfg.command} no chat. Integração com Spotify.</p>
      </div>

      {!spotifyConnected && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: S.red, fontSize: '0.9rem' }}>Spotify não conectado</div>
            <div style={{ color: S.muted, fontSize: '0.8rem' }}>Conecte o Spotify em <a href="/dashboard/conexoes" style={{ color: S.primary }}>Conexões</a> para usar pedidos de música</div>
          </div>
        </div>
      )}

      {/* Now playing */}
      {nowPlaying && (
        <div style={{ background: `linear-gradient(135deg,rgba(29,185,84,0.12),rgba(29,185,84,0.06))`, border: `1px solid ${S.borderP}`, borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {nowPlaying.thumbnail && <img src={nowPlaying.thumbnail} alt="" style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: S.primary, fontWeight: 700, marginBottom: '0.2rem', letterSpacing: '0.5px' }}>
              {nowPlaying.is_playing ? '▶ TOCANDO AGORA' : '⏸ PAUSADO'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nowPlaying.title}</div>
            <div style={{ fontSize: '0.82rem', color: S.muted }}>{nowPlaying.artist}</div>
            <div style={{ marginTop: '0.5rem', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: S.primary, width: `${(nowPlaying.progress_ms / nowPlaying.duration_ms) * 100}%`, borderRadius: '99px' }} />
            </div>
          </div>
          <button onClick={handleSkip} disabled={skipping} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: S.muted, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>
            {skipping ? '...' : '⏭ Skip'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['fila', 'config'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: `1px solid ${tab === t ? S.primary + '60' : S.border}`, background: tab === t ? S.primaryBg : 'transparent', color: tab === t ? S.primary : S.muted, fontWeight: tab === t ? 700 : 500, cursor: 'pointer', fontSize: '0.87rem' }}>
            {t === 'fila' ? `🎵 Fila (${pending.length})` : '⚙️ Configurações'}
          </button>
        ))}
      </div>

      {tab === 'fila' && (
        <>
          {/* Manual search */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: S.muted, marginBottom: '0.75rem', letterSpacing: '0.3px' }}>ADICIONAR MANUALMENTE</div>
            <div style={{ position: 'relative' }}>
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Buscar música no Spotify..."
                style={{ width: '100%', padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, borderRadius: '8px', color: S.text, fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            {searching && <div style={{ color: S.muted, fontSize: '0.8rem', marginTop: '0.5rem' }}>Buscando...</div>}
            {searchResults.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {searchResults.map(r => (
                  <div key={r.uri} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: '8px' }}>
                    {r.thumbnail && <img src={r.thumbnail} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.87rem', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div style={{ fontSize: '0.75rem', color: S.muted }}>{r.artist} · {fmtDur(r.duration_ms)}</div>
                    </div>
                    <button onClick={() => handleAddManual(r)} disabled={adding} style={{ padding: '0.4rem 0.9rem', background: S.primaryBg, border: `1px solid ${S.borderP}`, borderRadius: '6px', color: S.primary, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                      + Fila
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Queue */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: S.text, fontSize: '0.9rem' }}>Fila de Pedidos</div>
              {queue.length > 0 && (
                <button onClick={handleClear} style={{ fontSize: '0.78rem', color: S.red, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Limpar tudo</button>
              )}
            </div>

            {playing && (
              <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(29,185,84,0.06)', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', background: S.primaryBg, color: S.primary, padding: '0.15rem 0.5rem', borderRadius: '99px', fontWeight: 700, flexShrink: 0 }}>TOCANDO</span>
                {playing.thumbnail && <img src={playing.thumbnail} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.87rem', fontWeight: 700, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playing.title}</div>
                  <div style={{ fontSize: '0.75rem', color: S.muted }}>por @{playing.requester} · {playing.artist}</div>
                </div>
                <button onClick={handleSkip} style={{ padding: '0.35rem 0.7rem', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: '6px', color: S.muted, cursor: 'pointer', fontSize: '0.78rem' }}>⏭</button>
              </div>
            )}

            {pending.length === 0 && !playing ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: S.dim }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎵</div>
                <div style={{ fontSize: '0.85rem' }}>Nenhum pedido na fila. Viewers podem usar !{cfg.command} no chat.</div>
              </div>
            ) : (
              pending.map((item, idx) => (
                <div key={item.id} style={{ padding: '0.85rem 1.25rem', borderBottom: idx < pending.length - 1 ? `1px solid ${S.border}` : 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: S.dim, width: '20px', textAlign: 'center', flexShrink: 0 }}>#{idx + 1}</span>
                  {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.87rem', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: S.muted }}>pedido por @{item.requester} · {item.artist} · {fmtDur(item.duration_ms)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button onClick={() => handleMarkPlaying(item.id)} style={{ padding: '0.35rem 0.7rem', background: S.primaryBg, border: `1px solid ${S.borderP}`, borderRadius: '6px', color: S.primary, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>▶</button>
                    {item.spotify_url && (
                      <a href={item.spotify_url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.35rem 0.7rem', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: '6px', color: S.muted, fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>↗</a>
                    )}
                    <button onClick={() => handleRemove(item.id)} style={{ padding: '0.35rem 0.7rem', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: '6px', color: S.dim, cursor: 'pointer', fontSize: '0.78rem' }}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === 'config' && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Enable toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, color: S.text, fontSize: '0.9rem' }}>Pedidos de Música Ativado</div>
                <div style={{ color: S.muted, fontSize: '0.8rem' }}>Viewers podem usar !{cfg.command} no chat</div>
              </div>
              <button onClick={() => setCfg(c => ({ ...c, enabled: !c.enabled }))}
                style={{ width: '44px', height: '24px', borderRadius: '99px', background: cfg.enabled ? S.primary : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: '2px', left: cfg.enabled ? '22px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s', display: 'block' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Comando', key: 'command', type: 'text', prefix: '!' },
                { label: 'Cooldown (segundos)', key: 'cooldown_s', type: 'number' },
                { label: 'Tamanho máximo da fila', key: 'max_queue', type: 'number' },
              ].map(({ label, key, type, prefix }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: S.muted, marginBottom: '0.4rem', fontWeight: 600 }}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {prefix && <span style={{ color: S.muted, fontSize: '0.9rem' }}>{prefix}</span>}
                    <input type={type} value={(cfg as Record<string, unknown>)[key] as string}
                      onChange={e => setCfg(c => ({ ...c, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      style={{ flex: 1, padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, borderRadius: '8px', color: S.text, fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { key: 'allow_duplicates', label: 'Permitir músicas duplicadas na fila' },
                { key: 'announce_chat', label: 'Anunciar no chat quando música é adicionada' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={(cfg as Record<string, unknown>)[key] as boolean}
                    onChange={e => setCfg(c => ({ ...c, [key]: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: S.primary, cursor: 'pointer' }}
                  />
                  <span style={{ color: S.text, fontSize: '0.87rem' }}>{label}</span>
                </label>
              ))}
            </div>

            <button onClick={saveCfg} disabled={saving}
              style={{ padding: '0.75rem', background: saving ? 'rgba(255,255,255,0.06)' : S.primary, border: 'none', borderRadius: '10px', color: saving ? S.muted : '#000', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Salvando...' : '✓ Salvar Configurações'}
            </button>
          </div>

          {/* Overlay URL */}
          <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${S.border}`, borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: S.muted, marginBottom: '0.5rem' }}>URL DO OVERLAY (OBS)</div>
            <div style={{ fontSize: '0.78rem', color: S.dim, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/overlay/song-request?uid=SEU_ID` : '/overlay/song-request?uid=SEU_ID'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
