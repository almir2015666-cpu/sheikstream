import { getSupabaseAdmin } from '@/app/lib/supabase'

export type SpotifyTrack = {
  uri: string
  url: string
  title: string
  artist: string
  duration_ms: number
  thumbnail: string
}

async function refreshSpotifyToken(broadcasterId: string, refreshToken: string): Promise<string | null> {
  const credentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${credentials}` },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const newToken: string = data.access_token
    const newRefresh: string = data.refresh_token ?? refreshToken
    await getSupabaseAdmin().from('user_tokens').update({
      spotify_token: newToken,
      spotify_refresh_token: newRefresh,
      updated_at: new Date().toISOString(),
    }).eq('user_id', broadcasterId)
    return newToken
  } catch {
    return null
  }
}

export async function getSpotifyToken(broadcasterId: string): Promise<string | null> {
  const db = getSupabaseAdmin()
  const { data } = await db.from('user_tokens')
    .select('spotify_token, spotify_refresh_token')
    .eq('user_id', broadcasterId)
    .single()
  if (!data?.spotify_token) return null
  return data.spotify_token
}

async function spotifyFetch(
  broadcasterId: string,
  path: string,
  options: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const db = getSupabaseAdmin()
  const { data: tok } = await db.from('user_tokens')
    .select('spotify_token, spotify_refresh_token')
    .eq('user_id', broadcasterId)
    .maybeSingle()

  if (!tok?.spotify_token) return { ok: false, status: 401, data: null }

  const isWrite = options.method && options.method !== 'GET'
  const doFetch = async (token: string) => {
    const res = await fetch(`https://api.spotify.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isWrite ? { 'Content-Type': 'application/json' } : {}),
        ...((options.headers as Record<string, string>) ?? {}),
      },
    })
    const text = await res.text()
    let data: unknown = null
    if (text) { try { data = JSON.parse(text) } catch { data = null } }
    return { ok: res.ok, status: res.status, data }
  }

  let result = await doFetch(tok.spotify_token)
  if (result.status === 401 && tok.spotify_refresh_token) {
    const newToken = await refreshSpotifyToken(broadcasterId, tok.spotify_refresh_token)
    if (newToken) result = await doFetch(newToken)
  }
  return result
}

export async function searchSpotify(broadcasterId: string, query: string): Promise<SpotifyTrack[]> {
  const result = await spotifyFetch(broadcasterId, `/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`)
  if (!result.ok) return []
  const items = (result.data as { tracks?: { items?: unknown[] } })?.tracks?.items ?? []
  return items.map((item: unknown) => {
    const t = item as {
      uri: string; external_urls?: { spotify?: string }; name: string
      artists?: { name: string }[]; duration_ms: number; album?: { images?: { url: string }[] }
    }
    return {
      uri: t.uri,
      url: t.external_urls?.spotify ?? '',
      title: t.name,
      artist: t.artists?.[0]?.name ?? '',
      duration_ms: t.duration_ms,
      thumbnail: t.album?.images?.[0]?.url ?? '',
    }
  })
}

export async function addToSpotifyQueue(broadcasterId: string, uri: string): Promise<boolean> {
  const result = await spotifyFetch(broadcasterId, `/v1/me/player/queue?uri=${encodeURIComponent(uri)}`, { method: 'POST' })
  return result.ok
}

export async function skipSpotifyTrack(broadcasterId: string): Promise<boolean> {
  const result = await spotifyFetch(broadcasterId, '/v1/me/player/next', { method: 'POST' })
  return result.ok
}

export async function previousSpotify(broadcasterId: string): Promise<boolean> {
  const result = await spotifyFetch(broadcasterId, '/v1/me/player/previous', { method: 'POST' })
  return result.ok
}

export async function pauseSpotify(broadcasterId: string): Promise<boolean> {
  const result = await spotifyFetch(broadcasterId, '/v1/me/player/pause', { method: 'PUT' })
  return result.ok
}

export async function resumeSpotify(broadcasterId: string): Promise<boolean> {
  const result = await spotifyFetch(broadcasterId, '/v1/me/player/play', { method: 'PUT' })
  return result.ok
}

export async function getNowPlaying(broadcasterId: string): Promise<{ title: string; artist: string; thumbnail: string; progress_ms: number; duration_ms: number; is_playing: boolean; spotify_url: string } | null> {
  const result = await spotifyFetch(broadcasterId, '/v1/me/player/currently-playing')
  if (!result.ok || !result.data) return null
  const d = result.data as {
    is_playing?: boolean; progress_ms?: number
    item?: { name?: string; artists?: { name: string }[]; duration_ms?: number; album?: { images?: { url: string }[] }; external_urls?: { spotify?: string } }
  }
  if (!d.item) return null
  return {
    title: d.item.name ?? '',
    artist: d.item.artists?.[0]?.name ?? '',
    thumbnail: d.item.album?.images?.[0]?.url ?? '',
    progress_ms: d.progress_ms ?? 0,
    duration_ms: d.item.duration_ms ?? 0,
    is_playing: d.is_playing ?? false,
    spotify_url: d.item.external_urls?.spotify ?? '',
  }
}
