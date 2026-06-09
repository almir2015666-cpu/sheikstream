type Note = { f: number; t: number; d: number; v: number; w?: OscillatorType }

export type SoundCfg = {
  soundEnabled: boolean
  soundDataUrl: string  // base64 from uploaded file (preferred)
  soundUrl: string      // external URL (fallback)
  soundVolume: number
}

// Distinct musical phrases per event type (sine by default, triangle for metallic bits)
export const SLUG_SOUNDS: Record<string, Note[]> = {
  'twitch-follow':      [{ f:523, t:0,    d:0.12, v:0.28 }, { f:784, t:0.14, d:0.30, v:0.26 }],
  'twitch-sub':         [{ f:523, t:0,    d:0.09, v:0.35 }, { f:659, t:0.10, d:0.09, v:0.35 }, { f:784, t:0.20, d:0.42, v:0.40 }],
  'twitch-resub':       [{ f:659, t:0,    d:0.13, v:0.30 }, { f:523, t:0.14, d:0.10, v:0.28 }, { f:784, t:0.26, d:0.36, v:0.33 }],
  'twitch-giftsub':     [{ f:784, t:0,    d:0.08, v:0.32 }, { f:987, t:0.09, d:0.08, v:0.35 }, { f:1047,t:0.18, d:0.42, v:0.40 }],
  'twitch-bits':        [{ f:1047,t:0,    d:0.05, v:0.40, w:'triangle' }, { f:1319,t:0.07, d:0.05, v:0.38, w:'triangle' }, { f:1568,t:0.14, d:0.16, v:0.36, w:'triangle' }],
  'livepix':            [{ f:440, t:0,    d:0.10, v:0.28 }, { f:659, t:0.11, d:0.10, v:0.30 }, { f:880, t:0.22, d:0.38, v:0.35 }],
  'paypal':             [{ f:523, t:0,    d:0.10, v:0.28 }, { f:784, t:0.12, d:0.34, v:0.30 }],
  'kick-follow':        [{ f:587, t:0,    d:0.12, v:0.26 }, { f:880, t:0.14, d:0.28, v:0.25 }],
  'kick-sub':           [{ f:587, t:0,    d:0.09, v:0.32 }, { f:698, t:0.10, d:0.09, v:0.32 }, { f:880, t:0.20, d:0.38, v:0.37 }],
  'kick-giftsub':       [{ f:698, t:0,    d:0.08, v:0.30 }, { f:880, t:0.09, d:0.08, v:0.32 }, { f:1047,t:0.18, d:0.34, v:0.37 }],
  'youtube-member':     [{ f:440, t:0,    d:0.11, v:0.28 }, { f:587, t:0.12, d:0.11, v:0.30 }, { f:698, t:0.24, d:0.32, v:0.33 }],
  'youtube-giftmember': [{ f:523, t:0,    d:0.09, v:0.30 }, { f:784, t:0.10, d:0.09, v:0.33 }, { f:1047,t:0.20, d:0.38, v:0.38 }],
}

const FALLBACK: Note[] = [
  { f:659, t:0, d:0.14, v:0.28 },
  { f:784, t:0.16, d:0.30, v:0.30 },
]

// Shared AudioContext — created once and reused so OBS never sees a fresh suspended context
let _ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext ?? ((window as unknown) as Record<string, unknown>).webkitAudioContext as typeof AudioContext | undefined
  if (!AC) return null
  if (!_ctx || _ctx.state === 'closed') _ctx = new AC()
  return _ctx
}

// Convert base64 data URL to ArrayBuffer without fetch() (works in OBS)
function dataUrlToBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const binary = atob(base64)
  const buf = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i)
  return buf
}

async function decodeAndPlay(ctx: AudioContext, src: string | ArrayBuffer, vol: number) {
  let buf: ArrayBuffer
  if (typeof src === 'string') {
    if (src.startsWith('data:')) {
      // base64 data URL — decode locally, no fetch needed (OBS-safe)
      buf = dataUrlToBuffer(src)
    } else {
      buf = await (await fetch(src, { cache: 'no-store' })).arrayBuffer()
    }
  } else {
    buf = src
  }
  const decoded = await ctx.decodeAudioData(buf)
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  gain.gain.value = vol
  source.buffer = decoded
  source.connect(gain); gain.connect(ctx.destination)
  source.start(0)
}

function playNotes(ctx: AudioContext, notes: Note[], vol: number) {
  notes.forEach(({ f, t, d, v, w = 'sine' }) => {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = w
    o.frequency.setValueAtTime(f, ctx.currentTime + t)
    g.gain.setValueAtTime(0, ctx.currentTime + t)
    g.gain.linearRampToValueAtTime(vol * v, ctx.currentTime + t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d)
    o.start(ctx.currentTime + t)
    o.stop(ctx.currentTime + t + d + 0.05)
  })
}

export async function playAlertSound(
  slug: string | null | undefined,
  cfg: Pick<SoundCfg, 'soundEnabled' | 'soundDataUrl' | 'soundUrl' | 'soundVolume'>,
) {
  if (!cfg.soundEnabled) return
  const ctx = getCtx()
  if (!ctx) return
  const vol = Math.max(0, Math.min(1, cfg.soundVolume / 100))
  try {
    // resume() unblocks OBS suspended context; safe to call even if already running
    if (ctx.state !== 'running') await ctx.resume()

    // 1. Uploaded file (base64 data URL) — decoded locally, no network call
    if (cfg.soundDataUrl) {
      await decodeAndPlay(ctx, cfg.soundDataUrl, vol)
      return
    }
    // 2. External URL — route <audio> through AudioContext (OBS captures it)
    // Avoids fetch/CORS entirely; crossOrigin='anonymous' enables AudioContext routing
    if (cfg.soundUrl) {
      const el = new Audio()
      el.crossOrigin = 'anonymous'
      el.src = cfg.soundUrl
      try {
        const src = ctx.createMediaElementSource(el)
        const gain = ctx.createGain()
        gain.gain.value = vol
        src.connect(gain)
        gain.connect(ctx.destination)
        await el.play()
      } catch {
        // crossOrigin blocked (no CORS headers) — play directly via system audio
        const fallback = new Audio(cfg.soundUrl)
        fallback.volume = vol
        fallback.play().catch(() => {})
      }
      return
    }
    // 3. Built-in synthesized sound for this event type
    playNotes(ctx, (slug && SLUG_SOUNDS[slug]) ? SLUG_SOUNDS[slug] : FALLBACK, vol)
  } catch {}
}
