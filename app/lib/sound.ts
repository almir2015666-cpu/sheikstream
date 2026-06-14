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

// Default audio files hosted in /public/sounds — override the synthesized fallback per slug
const DEFAULT_SLUG_URLS: Record<string, string> = {
  'twitch-bits':    '/sounds/twitch-bits.mp3',
  'twitch-sub':     '/sounds/twitch-default-alert.mp3',
  'twitch-resub':   '/sounds/twitch-default-alert.mp3',
  'twitch-giftsub': '/sounds/twitch-default-alert.mp3',
  'twitch-follow':  '/sounds/twitch-default-alert.mp3',
}

const _urlCache: Map<string, AudioBuffer> = new Map()

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

function playNotes(ctx: AudioContext, notes: Note[], vol: number): Promise<void> {
  let maxEnd = 0
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
    maxEnd = Math.max(maxEnd, t + d + 0.05)
  })
  return new Promise(resolve => setTimeout(resolve, maxEnd * 1000 + 100))
}

function tryWebSpeech(text: string, lang: string, rate: number, vol: number) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = lang === 'pt-BR' ? 'pt-BR' : lang === 'pt-PT' ? 'pt-PT' : lang
  utt.rate = Math.max(0.5, Math.min(2, rate))
  utt.volume = Math.max(0, Math.min(1, vol))
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utt)
}

export async function playTts(
  text: string,
  lang: string,
  rate: number,
  vol: number,
): Promise<void> {
  if (!text.trim()) return
  const ctx = getCtx()
  if (!ctx) {
    tryWebSpeech(text, lang, rate, vol)
    return
  }
  try {
    // resume with timeout so it doesn't hang forever
    if (ctx.state !== 'running') {
      await Promise.race([ctx.resume(), new Promise<void>(r => setTimeout(r, 2000))])
    }
    const url = `/api/tts?lang=${encodeURIComponent(lang || 'pt-BR')}&text=${encodeURIComponent(text)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('tts_api_failed')
    const decoded = await ctx.decodeAudioData(await res.arrayBuffer())
    await new Promise<void>(resolve => {
      const src = ctx.createBufferSource()
      const gain = ctx.createGain()
      gain.gain.value = Math.max(0, Math.min(1, vol))
      src.buffer = decoded
      src.playbackRate.value = Math.max(0.5, Math.min(2, rate))
      src.connect(gain); gain.connect(ctx.destination)
      src.onended = () => resolve()
      src.start(0)
      // Safety: if onended never fires, resolve after duration + 1s
      setTimeout(resolve, (decoded.duration + 1) * 1000)
    })
  } catch {
    // API unavailable — fall back to browser TTS (works in regular browsers, not OBS)
    tryWebSpeech(text, lang, rate, vol)
  }
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

    const playBuffer = (decoded: AudioBuffer): Promise<void> =>
      new Promise(resolve => {
        const src = ctx.createBufferSource()
        const gain = ctx.createGain()
        gain.gain.value = vol
        src.buffer = decoded
        src.connect(gain); gain.connect(ctx.destination)
        src.onended = () => resolve()
        src.start(0)
        // Safety: resolve after audio duration + 500ms so TTS always fires
        setTimeout(resolve, (decoded.duration + 0.5) * 1000)
      })

    if (cfg.soundDataUrl) {
      const buf = dataUrlToBuffer(cfg.soundDataUrl)
      await playBuffer(await ctx.decodeAudioData(buf))
      return
    }

    // URL-based sound (custom or built-in default)
    const url = cfg.soundUrl ?? (slug ? DEFAULT_SLUG_URLS[slug] : undefined)
    if (url) {
      if (_urlCache.has(url)) {
        await playBuffer(_urlCache.get(url)!)
      } else {
        const res = await fetch(url)
        const decoded = await ctx.decodeAudioData(await res.arrayBuffer())
        _urlCache.set(url, decoded)
        await playBuffer(decoded)
      }
      return
    }

    await playNotes(ctx, (slug && SLUG_SOUNDS[slug]) ? SLUG_SOUNDS[slug] : FALLBACK, vol)
  } catch {}
}
