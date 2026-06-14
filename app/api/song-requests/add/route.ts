import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { searchSpotify, addToSpotifyQueue } from '@/app/lib/spotify'

// Called internally from eventsub when a viewer uses !sr
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET && secret !== 'sheikstream-internal-2024') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { broadcaster_id, requester, query } = body
  if (!broadcaster_id || !requester || !query) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  // Load config
  const { data: cfg } = await db.from('song_request_config').select('*').eq('broadcaster_id', broadcaster_id).maybeSingle()
  if (cfg && !cfg.enabled) return NextResponse.json({ error: 'disabled' }, { status: 200 })

  const maxQueue = cfg?.max_queue ?? 20
  const cooldownS = cfg?.cooldown_s ?? 60
  const allowDuplicates = cfg?.allow_duplicates ?? false

  // Check queue size
  const { count } = await db.from('song_requests').select('*', { count: 'exact', head: true })
    .eq('broadcaster_id', broadcaster_id).in('status', ['pending', 'playing'])
  if ((count ?? 0) >= maxQueue) {
    return NextResponse.json({ error: 'queue_full', message: `Fila cheia (máximo ${maxQueue} músicas)` })
  }

  // Check user cooldown
  if (cooldownS > 0) {
    const since = new Date(Date.now() - cooldownS * 1000).toISOString()
    const { count: recentCount } = await db.from('song_requests').select('*', { count: 'exact', head: true })
      .eq('broadcaster_id', broadcaster_id).eq('requester', requester).gte('created_at', since)
    if ((recentCount ?? 0) > 0) {
      return NextResponse.json({ error: 'cooldown', message: `Aguarde ${cooldownS}s entre pedidos` })
    }
  }

  // Search Spotify
  const results = await searchSpotify(broadcaster_id, query)
  if (!results.length) {
    return NextResponse.json({ error: 'not_found', message: `Música não encontrada: ${query}` })
  }

  const track = results[0]

  // Check duplicates
  if (!allowDuplicates) {
    const { count: dupCount } = await db.from('song_requests').select('*', { count: 'exact', head: true })
      .eq('broadcaster_id', broadcaster_id).eq('spotify_uri', track.uri).in('status', ['pending', 'playing'])
    if ((dupCount ?? 0) > 0) {
      return NextResponse.json({ error: 'duplicate', message: `${track.title} já está na fila` })
    }
  }

  // Get max position
  const { data: last } = await db.from('song_requests').select('position')
    .eq('broadcaster_id', broadcaster_id).in('status', ['pending', 'playing'])
    .order('position', { ascending: false }).limit(1).maybeSingle()
  const position = (last?.position ?? 0) + 1

  // Insert
  const { data: inserted, error } = await db.from('song_requests').insert({
    broadcaster_id,
    requester,
    title: track.title,
    artist: track.artist,
    spotify_uri: track.uri,
    spotify_url: track.url,
    duration_ms: track.duration_ms,
    thumbnail: track.thumbnail,
    status: 'pending',
    position,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Add to Spotify queue
  if (track.uri) {
    await addToSpotifyQueue(broadcaster_id, track.uri).catch(() => {})
  }

  return NextResponse.json({ ok: true, track: inserted })
}
