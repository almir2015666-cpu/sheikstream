type Note = { f: number; t: number; d: number; v: number; w?: OscillatorType }

export type SoundCfg = {
  soundEnabled: boolean
  soundDataUrl: string
  soundVolume: number
}

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

const FALLBACK: Note[] = [{ f:659, t:0, d:0.14, v:0.28 }, { f:784, t:0.16, d:0.30, v:0.30 }]

let _ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext ?? ((window as unknown) as Record<string, unknown>).webkitAudioContext as typeof AudioContext | undefined
  if (!AC) return null
  if (!_ctx || _ctx.state === 'closed') _ctx = new AC()
  return _ctx
}

function dataUrlToBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const binary = atob(base64)
  const buf = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i)
  return buf
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
  cfg: Pick<SoundCfg, 'soundEnabled' | 'soundDataUrl' | 'soundVolume'> & { soundUrl?: string },
) {
  if (!cfg.soundEnabled) return
  const ctx = getCtx()
  if (!ctx) return
  const vol = Math.max(0, Math.min(1, cfg.soundVolume / 100))
  try {
    if (ctx.state !== 'running') await ctx.resume()

    if (cfg.soundDataUrl) {
      const buf = dataUrlToBuffer(cfg.soundDataUrl)
      const decoded = await ctx.decodeAudioData(buf)
      const src = ctx.createBufferSource()
      const gain = ctx.createGain()
      gain.gain.value = vol
      src.buffer = decoded
      src.connect(gain); gain.connect(ctx.destination)
      src.start(0)
      return
    }

    playNotes(ctx, (slug && SLUG_SOUNDS[slug]) ? SLUG_SOUNDS[slug] : FALLBACK, vol)
  } catch {}
}
