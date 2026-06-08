'use client'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { notify } from '@/app/lib/notify'

// ─── Theme ─────────────────────────────────────────────────────────────────────
const C = {
  page: '#08090d', card: '#111219', cardB: 'rgba(255,255,255,0.06)', inner: '#0d0e16',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.5)', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)', primaryB: 'rgba(155,48,255,0.25)',
  green: '#39ff14', greenBg: 'rgba(57,255,20,0.1)', greenB: 'rgba(57,255,20,0.25)',
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type StyleCfg = {
  font: string; timerSize: number; titleSize: number; supportSize: number; width: number
  bgColor: string; bgOpacity: number; textColor: string; timerColor: string
  barColor: string; barBg: string; barThickness: number
  border: boolean; borderColor: string; borderThick: number; borderRadius: number
}
type VisCfg = Record<string, boolean>
type FontesCfg = Record<string, boolean>

// ─── Constants ─────────────────────────────────────────────────────────────────
const FONTS = ['Inter', 'Open Sans', 'Roboto', 'Montserrat', 'Poppins', 'Rajdhani', 'Exo 2', 'Nunito']

const DEF: StyleCfg = {
  font: 'Inter', timerSize: 120, titleSize: 14, supportSize: 11, width: 560,
  bgColor: '#0b0c17', bgOpacity: 0.92, textColor: '#ffffff', timerColor: '#9146FF',
  barColor: '#9146FF', barBg: '#222222', barThickness: 8,
  border: false, borderColor: '#9146FF', borderThick: 1, borderRadius: 16,
}

const PRESETS = [
  { id: 'twitch-classic', label: 'Twitch Classic',  desc: 'Roxo escuro com barra violeta',      bg: '#0e0b18', bgOp: 1,    bar: '#9146ff', barBg: '#1a1a1a', text: '#ffffff', border: false, borderC: '#9146ff', timer: '#9146FF' },
  { id: 'streamelements', label: 'StreamElements',   desc: 'Fundo claro com texto escuro',       bg: '#ffffff', bgOp: 1,    bar: '#e84040', barBg: '#dddddd', text: '#111111', border: false, borderC: '#e84040', timer: '#e84040' },
  { id: 'nerd-or-die',    label: 'Nerd or Die',      desc: 'Preto com neon verde minimalista',   bg: '#111111', bgOp: 1,    bar: '#39ff14', barBg: '#1f1f1f', text: '#ffffff', border: false, borderC: '#39ff14', timer: '#39ff14' },
  { id: 'own3d-pro',      label: 'OWN3D Pro',        desc: 'Glassmorphism com borda sutil',      bg: '#101020', bgOp: 0.85, bar: '#4fa3ff', barBg: '#1a2040', text: '#ffffff', border: true,  borderC: '#4fa3ff', timer: '#4fa3ff' },
  { id: 'gaming-red',     label: 'Gaming Red',       desc: 'Preto com vermelho intenso',         bg: '#0a0a0a', bgOp: 1,    bar: '#ff2222', barBg: '#1a0000', text: '#ffffff', border: true,  borderC: '#ff3333', timer: '#ff2222' },
  { id: 'cyberpunk',      label: 'Cyberpunk',        desc: 'Preto com neon amarelo e ciano',    bg: '#0a0a0a', bgOp: 1,    bar: '#00ffff', barBg: '#111111', text: '#ffff00', border: false, borderC: '#00ffff', timer: '#ffff00' },
  { id: 'vaporwave',      label: 'Vaporwave',        desc: 'Roxo profundo com rosa e lilás',     bg: '#1a0a2e', bgOp: 1,    bar: '#ff6ec7', barBg: '#2d1050', text: '#e8b4ff', border: false, borderC: '#ff6ec7', timer: '#ff6ec7' },
  { id: 'glassmorphism',  label: 'Glassmorphism',    desc: 'Vidro fosco com borda branca',       bg: '#ffffff', bgOp: 0.08, bar: '#ffffff', barBg: '#ffffff22', text: '#ffffff', border: true, borderC: '#ffffff', timer: '#ffffff' },
  { id: 'military',       label: 'Military',         desc: 'Verde oliva escuro estilo tático',   bg: '#1a1f0e', bgOp: 1,    bar: '#6b8c21', barBg: '#0f1208', text: '#c8d8a0', border: false, borderC: '#6b8c21', timer: '#6b8c21' },
  { id: 'minimal',        label: 'Minimal',          desc: 'Ultra fino com transparência',       bg: '#000000', bgOp: 0,    bar: '#ffffff', barBg: '#ffffff15', text: '#ffffff', border: false, borderC: '#ffffff', timer: '#ffffff' },
  { id: 'ocean',          label: 'Ocean',            desc: 'Azul profundo com brilho aquático',  bg: '#0a1628', bgOp: 1,    bar: '#00d4ff', barBg: '#0f2040', text: '#7dd3fc', border: false, borderC: '#00d4ff', timer: '#00d4ff' },
  { id: 'sunset',         label: 'Sunset',           desc: 'Laranja quente ao pôr do sol',       bg: '#1a0a00', bgOp: 1,    bar: '#ff7020', barBg: '#200e00', text: '#ffd090', border: false, borderC: '#ff7020', timer: '#ff7020' },
]

const TYPE_META: Record<string, { label: string; overlayPath: string; defVis: VisCfg; defFon: FontesCfg }> = {
  patrocinadores: { label: 'Patrocinadores',   overlayPath: '/overlay/banners',  defVis: {}, defFon: {} },
  subathon:       { label: 'Subathon',         overlayPath: '/overlay/subathon', defVis: { title: true, tags: true, lastContrib: true }, defFon: {} },
  'meta-subs':    { label: 'Meta de Subs',     overlayPath: '/overlay/meta',     defVis: { title: true, desc: false, pct: true, values: true }, defFon: { subs: true, resubs: true, gifts: true, prime: false, ytMembers: false, ytGifts: false } },
  sorteio:        { label: 'Meta de Sorteio',  overlayPath: '/overlay/sorteio',  defVis: { values: true, recent: true, lines: false }, defFon: { livepix: true, twitch: true, youtube: true, paypal: false, kick: false, tiktok: false } },
  meta:           { label: 'Meta',             overlayPath: '/overlay/meta',     defVis: { title: true, desc: true, pct: true, values: true }, defFon: {} },
}

// ─── Mini UI components ────────────────────────────────────────────────────────
function Card({ children, style: s }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, padding: '1rem 1.1rem', marginBottom: '0.75rem', ...s }}>{children}</div>
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>{children}</div>
}

function Tog({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div onClick={() => onChange(!on)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.7rem', background: on ? C.primaryBg : 'rgba(255,255,255,0.02)', border: `1px solid ${on ? C.primaryB : C.cardB}`, borderRadius: 8, marginBottom: '0.35rem', cursor: 'pointer', userSelect: 'none' }}>
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.text }}>{label}</div>
        {desc && <div style={{ fontSize: '0.7rem', color: C.dim }}>{desc}</div>}
      </div>
      <div style={{ width: 34, height: 19, background: on ? C.primary : 'rgba(255,255,255,0.12)', borderRadius: 10, position: 'relative', flexShrink: 0, marginLeft: 10, transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 15, height: 15, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '0.25rem 0.65rem', background: active ? C.greenBg : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? C.greenB : C.cardB}`, borderRadius: 999, fontSize: '0.75rem', color: active ? C.green : C.dim, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />}
      {children}
    </button>
  )
}

function RangeInput({ label, value, min, max, unit, step = 1, onChange }: { label: string; value: number; min: number; max: number; unit: string; step?: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.67rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label} — {value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: C.primary, cursor: 'pointer' }} />
    </div>
  )
}

function ColorIn({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: '0.67rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.4rem 0.75rem' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 22, height: 22, border: 'none', background: 'none', padding: 0, cursor: 'pointer', borderRadius: 3 }} />
        <span style={{ fontSize: '0.78rem', color: C.text, fontFamily: 'monospace' }}>{value.toUpperCase()}</span>
      </div>
    </div>
  )
}

function Collapse({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.7rem 0', background: 'none', border: 'none', borderTop: `1px solid ${C.cardB}`, cursor: 'pointer', color: C.text }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div style={{ paddingBottom: '0.75rem' }}>{children}</div>}
    </div>
  )
}

// ─── Mock preview renderers ────────────────────────────────────────────────────
function MetaPreview({ s, vis }: { s: StyleCfg; vis: VisCfg }) {
  const pct = 65
  const bg = s.bgOpacity === 0 ? 'transparent' : s.bgColor
  return (
    <div style={{ background: bg, padding: '12px 16px', borderRadius: s.borderRadius, maxWidth: s.width, margin: '0 auto', border: s.border ? `${s.borderThick}px solid ${s.borderColor}` : 'none', fontFamily: s.font }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        {vis.title && <div style={{ color: s.textColor, fontSize: s.titleSize, fontWeight: 700 }}>meta ativa</div>}
        {vis.pct && <div style={{ color: s.barColor, fontSize: s.titleSize, fontWeight: 700 }}>{pct}%</div>}
      </div>
      {vis.desc && <div style={{ color: s.textColor, opacity: 0.55, fontSize: s.supportSize, marginBottom: 8 }}>descrição da meta</div>}
      <div style={{ background: s.barBg, borderRadius: 99, height: s.barThickness, marginBottom: 6, overflow: 'hidden' }}>
        <div style={{ background: s.barColor, width: `${pct}%`, height: '100%', borderRadius: 99 }} />
      </div>
      {vis.values && <div style={{ display: 'flex', justifyContent: 'space-between', color: s.textColor, opacity: 0.45, fontSize: s.supportSize }}>
        <span>650 ARRECADADO</span><span>meta: 1.000</span>
      </div>}
    </div>
  )
}

function SubathonPreview({ s, vis }: { s: StyleCfg; vis: VisCfg }) {
  const bg = s.bgOpacity === 0 ? 'transparent' : s.bgColor
  const scale = Math.min(1, 480 / Math.max(s.width, 200))
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: s.width, margin: '0 auto' }}>
      <div style={{ background: bg, padding: '20px 28px 16px', borderRadius: s.borderRadius, textAlign: 'center', border: s.border ? `${s.borderThick}px solid ${s.borderColor}` : 'none', fontFamily: s.font, boxShadow: `0 0 30px ${s.timerColor}22` }}>
        {vis.title && <div style={{ color: s.textColor, fontSize: s.titleSize, marginBottom: 6, opacity: 0.7, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>nome do subathon</div>}
        <div style={{ color: s.timerColor, fontSize: s.timerSize, fontWeight: 900, lineHeight: 1, marginBottom: 12, letterSpacing: '-2px', textShadow: `0 0 30px ${s.timerColor}66` }}>01:23:45</div>
        {vis.tags && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ padding: '3px 10px', background: `${s.timerColor}22`, color: s.timerColor, border: `1px solid ${s.timerColor}55`, borderRadius: 99, fontSize: s.supportSize + 1, fontWeight: 700 }}>+2m TWITCH SUB</span>
            <span style={{ padding: '3px 10px', background: 'rgba(57,255,20,0.15)', color: '#39ff14', border: '1px solid rgba(57,255,20,0.4)', borderRadius: 99, fontSize: s.supportSize + 1, fontWeight: 700 }}>+1m LIVEPIX</span>
            <span style={{ padding: '3px 10px', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 99, fontSize: s.supportSize + 1, fontWeight: 700 }}>+30s BITS</span>
          </div>
        )}
        {vis.lastContrib && <div style={{ color: s.textColor, opacity: 0.4, fontSize: s.supportSize, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.timerColor, display: 'inline-block' }} />
          viewer123 +2m
        </div>}
      </div>
    </div>
  )
}

function SorteioPreview({ s, vis, fontes }: { s: StyleCfg; vis: VisCfg; fontes: FontesCfg }) {
  const pct = 42
  const bg = s.bgOpacity === 0 ? 'transparent' : s.bgColor
  return (
    <div style={{ background: bg, padding: '12px 16px', borderRadius: s.borderRadius, maxWidth: s.width, margin: '0 auto', border: s.border ? `${s.borderThick}px solid ${s.borderColor}` : 'none', fontFamily: s.font }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <div style={{ color: s.textColor, fontSize: s.titleSize, fontWeight: 700 }}>🏆 selecione um sorteio</div>
        {vis.values && <div style={{ color: s.barColor, fontSize: s.supportSize, fontWeight: 700 }}>{pct}%</div>}
      </div>
      <div style={{ color: s.textColor, opacity: 0.5, fontSize: s.supportSize - 1, marginBottom: 8 }}>PRÊMIO DE EXEMPLO</div>
      <div style={{ background: s.barBg, borderRadius: 99, height: s.barThickness, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{ background: s.barColor, width: `${pct}%`, height: '100%', borderRadius: 99 }} />
      </div>
      {vis.values && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          {fontes.livepix  && <div style={{ textAlign: 'center' }}><div style={{ color: '#ff6eb6', fontSize: 8 }}>♥ LIVEPIX</div><div style={{ color: s.textColor, fontSize: 11, fontWeight: 700 }}>22</div></div>}
          {fontes.twitch   && <div style={{ textAlign: 'center' }}><div style={{ color: '#9b30ff', fontSize: 8 }}>■ TWITCH</div><div style={{ color: s.textColor, fontSize: 11, fontWeight: 700 }}>10</div></div>}
          {fontes.youtube  && <div style={{ textAlign: 'center' }}><div style={{ color: '#ff4040', fontSize: 8 }}>▶ YOUTUBE</div><div style={{ color: s.textColor, fontSize: 11, fontWeight: 700 }}>7</div></div>}
          {fontes.paypal   && <div style={{ textAlign: 'center' }}><div style={{ color: '#1e9ef5', fontSize: 8 }}>P PAYPAL</div><div style={{ color: s.textColor, fontSize: 11, fontWeight: 700 }}>3</div></div>}
        </div>
      )}
      {vis.recent && <div style={{ color: s.textColor, opacity: 0.35, fontSize: s.supportSize - 1 }}>Últimos: viewerAlpha, subbeta, doacaoGama, m...</div>}
    </div>
  )
}

function PatroPreview({ s }: { s: StyleCfg }) {
  const bg = s.bgOpacity === 0 ? 'transparent' : s.bgColor
  return (
    <div style={{ background: bg, padding: '16px', borderRadius: s.borderRadius, maxWidth: s.width, margin: '0 auto', border: s.border ? `${s.borderThick}px solid ${s.borderColor}` : `1px dashed ${C.cardB}`, fontFamily: s.font, textAlign: 'center' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '24px 16px', marginBottom: 8 }}>
        <div style={{ color: C.dim, fontSize: 11 }}>[ imagem do patrocinador ]</div>
      </div>
      <div style={{ color: s.textColor, opacity: 0.5, fontSize: s.supportSize }}>patrocinador.com.br</div>
    </div>
  )
}

// ─── Preset mini preview card ──────────────────────────────────────────────────
function PresetCard({ p, active, onClick }: { p: typeof PRESETS[0]; active: boolean; onClick: () => void }) {
  const previewBg = p.bgOp === 0 ? '#1a1a1a' : p.bg
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', border: active ? `2px solid ${C.primary}` : '2px solid transparent', borderRadius: 9, overflow: 'hidden', background: C.inner }}>
      <div style={{ background: previewBg, padding: '8px 10px', border: p.border ? `1px solid ${p.borderC}` : '1px solid transparent' }}>
        <div style={{ color: p.text, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Meta de Subs</div>
        <div style={{ background: p.barBg, borderRadius: 3, height: 5, marginBottom: 3 }}>
          <div style={{ background: p.bar, width: '65%', height: '100%', borderRadius: 3 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: p.text, fontSize: 7, opacity: 0.5 }}>65 / 100</span>
        </div>
      </div>
      <div style={{ padding: '5px 8px' }}>
        <div style={{ color: C.text, fontSize: 9, fontWeight: 600 }}>{p.label}</div>
        <div style={{ color: C.dim, fontSize: 8, marginTop: 1 }}>{p.desc}</div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Ctx = { params: Promise<{ type: string }> }

export default function OverlayEditorPage({ params }: Ctx) {
  const { type } = use(params)
  const meta = TYPE_META[type] ?? TYPE_META['meta']

  const [style, setStyle] = useState<StyleCfg>(DEF)
  const [vis, setVis] = useState<VisCfg>(meta.defVis)
  const [fontes, setFontes] = useState<FontesCfg>(meta.defFon)
  const [exp, setExp] = useState({ tipografia: true, dimensoes: true, cores: true, borda: false })
  const [uid, setUid] = useState('')
  const [savedOk, setSavedOk] = useState(false)
  const [copiedOk, setCopiedOk] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Patrocinadores-specific state
  const [bannerUrls, setBannerUrls] = useState(['', ''])
  const [waitSecs, setWaitSecs] = useState(5)
  const [dispSecs, setDispSecs] = useState(10)
  const [banLayout, setBanLayout] = useState<'single' | 'double'>('single')
  const [newBannerUrl, setNewBannerUrl] = useState('')
  const [subathonActive, setSubathonActive] = useState<boolean | null>(null)

  useEffect(() => {
    if (type === 'subathon') {
      fetch('/api/subathon').then(r => r.json()).then(d => setSubathonActive(!!d?.is_active)).catch(() => setSubathonActive(false))
    }
    fetch('/api/me').then(r => r.json()).then(d => { if (d?.id) setUid(d.id) }).catch(() => {})
    try {
      const raw = localStorage.getItem(`overlay-cfg-${type}`)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.style) setStyle(s => ({ ...s, ...saved.style }))
        if (saved.vis) setVis(v => ({ ...v, ...saved.vis }))
        if (saved.fontes) setFontes(f => ({ ...f, ...saved.fontes }))
        if (saved.bannerUrls) setBannerUrls(saved.bannerUrls)
        if (saved.activePreset) setActivePreset(saved.activePreset)
      }
    } catch {}
  }, [type])

  function upS<K extends keyof StyleCfg>(key: K, val: StyleCfg[K]) {
    setStyle(prev => ({ ...prev, [key]: val }))
    setActivePreset(null)
  }

  function applyPreset(p: typeof PRESETS[0]) {
    setStyle(prev => ({ ...prev, bgColor: p.bg, bgOpacity: p.bgOp, barColor: p.bar, barBg: p.barBg, textColor: p.text, border: p.border, borderColor: p.borderC, timerColor: p.timer }))
    setActivePreset(p.id)
  }

  function buildCfgParam() {
    const visCfg = type === 'subathon'
      ? { showTitle: vis.title ?? true, showTags: vis.tags ?? true, showLastContrib: vis.lastContrib ?? true }
      : {}
    try { return btoa(JSON.stringify({ ...style, ...visCfg })) } catch { return '' }
  }

  function buildUrl() {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://sheikstream.com.br'
    const id = uid || 'SEU_ID'
    return `${base}${meta.overlayPath}?uid=${id}`
  }

  async function save() {
    const localPayload = { style, vis, fontes, bannerUrls, activePreset }
    try { localStorage.setItem(`overlay-cfg-${type}`, JSON.stringify(localPayload)) } catch {}
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 2500)
    // Save to DB so overlay auto-updates in OBS without changing URL
    fetch(`/api/overlay-config/${type}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localPayload),
    }).then(r => {
      if (r.ok) {
        notify('Overlay salvo! As mudanças aparecem automaticamente no OBS.', 'success')
      } else {
        notify('Configuração salva localmente.', 'info')
      }
    }).catch(() => notify('Configuração salva localmente.', 'info'))
  }

  function copyUrl() {
    navigator.clipboard.writeText(buildUrl()).catch(() => {})
    setCopiedOk(true)
    setTimeout(() => setCopiedOk(false), 2000)
    notify('URL copiada! Cole no OBS como Browser Source.', 'success')
  }

  const overlayUrl = buildUrl()

  // ─── Left panel per type ───────────────────────────────────────────────────
  function renderLeft() {
    if (type === 'patrocinadores') {
      return (
        <>
          <Card>
            <Label>Widget</Label>
            <RangeInput label="Espera entre ciclos (s)" value={waitSecs} min={1} max={60} unit="s" onChange={setWaitSecs} />
            <RangeInput label="Duração padrão de exibição (s)" value={dispSecs} min={1} max={60} unit="s" onChange={setDispSecs} />
            <RangeInput label="Largura" value={style.width} min={100} max={1920} unit="px" onChange={v => upS('width', v)} />
            <RangeInput label="Altura" value={200} min={50} max={500} unit="px" onChange={() => {}} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <ColorIn label="Cor de fundo" value={style.bgColor} onChange={v => upS('bgColor', v)} />
            </div>
            <RangeInput label="Transparência" value={Math.round(style.bgOpacity * 100)} min={0} max={100} unit="%" onChange={v => upS('bgOpacity', v / 100)} />
            <div style={{ marginTop: '0.5rem' }}>
              <Label>Posicionamento</Label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['single', 'double'] as const).map(l => (
                  <button key={l} onClick={() => setBanLayout(l)} style={{ flex: 1, padding: '0.5rem', background: banLayout === l ? C.primaryBg : 'rgba(255,255,255,0.03)', border: `1px solid ${banLayout === l ? C.primaryB : C.cardB}`, borderRadius: 7, color: banLayout === l ? C.primary : C.text, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                    {l === 'single' ? 'Único' : 'Duplo'}
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <Label>Espaço 1</Label>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.73rem', color: C.dim }}>Faça upload da imagem em Imgur, Google Drive (link público), Discord ou similar e cole a URL HTTPS aqui.</p>
            {bannerUrls.map((url, i) => (
              url && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 7, padding: '0.4rem 0.7rem' }}>
                  <span style={{ flex: 1, fontSize: '0.72rem', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                  <button onClick={() => setBannerUrls(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 16, padding: '0 2px' }}>×</button>
                </div>
              )
            ))}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={newBannerUrl} onChange={e => setNewBannerUrl(e.target.value)} placeholder="https://i.imgur.com/exemplo.png" style={{ flex: 1, background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 7, padding: '0.45rem 0.7rem', color: C.text, fontSize: '0.78rem', outline: 'none' }} />
              <button onClick={() => { if (newBannerUrl.trim()) { setBannerUrls(prev => [...prev, newBannerUrl.trim()]); setNewBannerUrl('') } }} style={{ padding: '0.45rem 0.85rem', background: C.primaryBg, border: `1px solid ${C.primaryB}`, borderRadius: 7, color: C.primary, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                + Adicionar
              </button>
            </div>
          </Card>
        </>
      )
    }

    if (type === 'subathon') {
      return (
        <Card>
          <Label>Subathon</Label>
          {subathonActive === false && (
            <div style={{ background: C.inner, border: `1px solid rgba(251,191,36,0.25)`, borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '0.75rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#fbbf24' }}>
                Nenhum subathon ativo — crie um em{' '}
                <Link href="/dashboard/subathon" style={{ color: '#fbbf24', textDecoration: 'underline' }}>Subathon</Link>.
              </p>
            </div>
          )}
          {subathonActive === true && (
            <div style={{ background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.2)', borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#39ff14', display: 'inline-block', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#39ff14' }}>Subathon ativo — overlay sincronizado.</p>
            </div>
          )}
          <Label>Elementos visíveis</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {[['title','Título'],['tags','Tags de regras'],['lastContrib','Última contribuição']].map(([k,l]) => (
              <Chip key={k} active={!!vis[k]} onClick={() => setVis(v => ({ ...v, [k]: !v[k] }))}>{l}</Chip>
            ))}
          </div>
        </Card>
      )
    }

    if (type === 'meta-subs') {
      return (
        <>
          <Card>
            <Label>Meta</Label>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.73rem', color: C.dim, marginBottom: '0.3rem' }}>Tipo de Meta</div>
              <select style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.45rem 0.75rem', color: C.text, fontSize: '0.83rem', outline: 'none' }}>
                <option>Meta de inscritos</option>
                <option>Meta de bits</option>
                <option>Meta de seguidores</option>
                <option>Meta de gift subs</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.73rem', color: C.dim, marginBottom: '0.3rem' }}>Meta Final</div>
                <input type="number" defaultValue={100} style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.45rem 0.7rem', color: C.text, fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.73rem', color: C.dim, marginBottom: '0.3rem' }}>Valor Atual</div>
                <input type="number" defaultValue={0} style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.45rem 0.7rem', color: C.text, fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardB}`, borderRadius: 7, color: C.text, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>↺ Redefinir</button>
              <button style={{ flex: 1, padding: '0.5rem', background: C.greenBg, border: `1px solid ${C.greenB}`, borderRadius: 7, color: C.green, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>⚑ Finalizar</button>
            </div>
          </Card>
          <Card>
            <Label>Plataforma — eventos que incrementam a meta</Label>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.primary, marginBottom: '0.4rem' }}>Twitch</div>
              {[['subs','Inscrições','Novos inscritos no canal'],['resubs','Reinscriçōes','Renovação de inscrição com mensagem'],['gifts','Presentes de inscrição','Gift subs enviados no canal'],['prime','Assinantes Prime','Inscrições usando Twitch Prime']].map(([k,l,d]) => (
                <Tog key={k} on={!!fontes[k]} onChange={v => setFontes(f => ({ ...f, [k]: v }))} label={l} desc={d} />
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ff4040', marginBottom: '0.4rem' }}>YouTube</div>
              {[['ytMembers','Membros','Novos membros do canal'],['ytGifts','Membros presenteados','Membros presenteados no canal']].map(([k,l,d]) => (
                <Tog key={k} on={!!fontes[k]} onChange={v => setFontes(f => ({ ...f, [k]: v }))} label={l} desc={d} />
              ))}
            </div>
          </Card>
        </>
      )
    }

    if (type === 'sorteio') {
      return (
        <Card>
          <Label>Fontes de Tickets</Label>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.73rem', color: C.dim }}>Escolha quais plataformas aparecem no overlay.</p>
          {[['livepix','♥','#ff6eb6','Livepix'],['twitch','■','#9b30ff','Twitch Subs'],['youtube','▶','#ff4040','YouTube Membros'],['paypal','P','#1e9ef5','PayPal'],['kick','K','#53fc18','Kick'],['tiktok','♪','#e2e2e2','TikTok']].map(([k,icon,color,l]) => (
            <Tog key={k} on={!!fontes[k]} onChange={v => setFontes(f => ({ ...f, [k]: v }))} label={`${icon} ${l}`} />
          ))}
        </Card>
      )
    }

    // meta (generic)
    return (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Label>Overlay de Meta</Label>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: C.primaryBg, color: C.primary, borderRadius: 999, border: `1px solid ${C.primaryB}` }}>NOVO</span>
        </div>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.73rem', color: C.dim }}>Escolha uma meta pública e personalize o overlay com o mesmo padrão do catálogo.</p>
        {[['title','Título'],['desc','Descrição'],['pct','Porcentagem'],['values','Valores (Atual, meta e progresso)']].map(([k,l]) => (
          <Tog key={k} on={!!vis[k]} onChange={v => setVis(vv => ({ ...vv, [k]: v }))} label={l} />
        ))}
        <div style={{ marginTop: '0.5rem' }}>
          <Link href="/dashboard/metas" style={{ fontSize: '0.75rem', color: C.primary, textDecoration: 'none' }}>
            Criar ou liberar uma meta na página de Metas →
          </Link>
        </div>
      </Card>
    )
  }

  // ─── Mock preview ──────────────────────────────────────────────────────────
  function renderPreview() {
    if (type === 'patrocinadores') return <PatroPreview s={style} />
    if (type === 'subathon')       return <SubathonPreview s={style} vis={vis} />
    if (type === 'sorteio')        return <SorteioPreview s={style} vis={vis} fontes={fontes} />
    return <MetaPreview s={style} vis={vis} />
  }

  // ─── Visibility chips ──────────────────────────────────────────────────────
  function renderChips() {
    if (type === 'subathon') {
      return [['title','Título'],['tags','Tags de regras'],['lastContrib','Última contribuição']].map(([k,l]) => (
        <Chip key={k} active={!!vis[k]} onClick={() => setVis(v => ({ ...v, [k]: !v[k] }))}>{l}</Chip>
      ))
    }
    if (type === 'sorteio') {
      return [['lines','Linhas separadas'],['values','Exibir valores'],['recent','Atividades recentes']].map(([k,l]) => (
        <Chip key={k} active={!!vis[k]} onClick={() => setVis(v => ({ ...v, [k]: !v[k] }))}>{l}</Chip>
      ))
    }
    if (type === 'meta' || type === 'meta-subs') {
      return [['title','Título'],['desc','Descrição'],['pct','Porcentagem'],['values','Valores']].map(([k,l]) => (
        <Chip key={k} active={!!vis[k]} onClick={() => setVis(v => ({ ...v, [k]: !v[k] }))}>{l}</Chip>
      ))
    }
    return null
  }

  const isBarType = type !== 'subathon' && type !== 'patrocinadores'

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link href="/dashboard/overlays" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: C.dim, textDecoration: 'none', fontSize: '0.82rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </Link>
        <span style={{ color: C.cardB }}>|</span>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Editando: {meta.label}</h2>
      </div>

      {/* Two-column top section */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Left: type-specific config */}
        <div>{renderLeft()}</div>

        {/* Right: preview panel */}
        <div>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Preview header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', borderBottom: `1px solid ${C.cardB}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prévia ao vivo</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={save} style={{ padding: '0.35rem 0.85rem', background: savedOk ? C.greenBg : C.primaryBg, border: `1px solid ${savedOk ? C.greenB : C.primaryB}`, borderRadius: 6, color: savedOk ? C.green : C.primary, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  {savedOk ? '✓ Salvo!' : 'Salvar'}
                </button>
                <button onClick={copyUrl} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: copiedOk ? C.green : C.dim, cursor: 'pointer', fontSize: '0.78rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  {copiedOk ? 'Copiado!' : 'Copiar URL'}
                </button>
                <a href={overlayUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: C.dim, textDecoration: 'none', fontSize: '0.78rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Visualizar
                </a>
              </div>
            </div>

            {/* URL display */}
            <div style={{ padding: '0.5rem 1rem', borderBottom: `1px solid ${C.cardB}` }}>
              <span style={{ fontSize: '0.73rem', color: C.vdim, fontFamily: 'monospace', wordBreak: 'break-all' }}>{overlayUrl}</span>
            </div>

            {/* Preview box */}
            <div style={{ padding: '1.5rem', background: '#0a0b11', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderPreview()}
            </div>

            {/* Caption */}
            <div style={{ padding: '0.45rem 1rem', borderTop: `1px solid ${C.cardB}`, textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: C.vdim }}>Layout padrão — dados ao vivo via OBS</span>
            </div>
          </div>

          {/* Visibility chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
            {renderChips()}
          </div>
        </div>
      </div>

      {/* ESTILO section */}
      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, padding: '0 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.9rem 0', borderBottom: `1px solid ${C.cardB}` }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estilo</div>
          <div style={{ fontSize: '0.73rem', color: C.dim, marginTop: '0.2rem' }}>Ajuste tipografia, dimensões e cores. Use os chips abaixo da prévia para exibir/ocultar elementos.</div>
        </div>

        <Collapse title="Tipografia" open={exp.tipografia} onToggle={() => setExp(e => ({ ...e, tipografia: !e.tipografia }))}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.67rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Fonte</div>
            <select value={style.font} onChange={e => upS('font', e.target.value)} style={{ width: 200, background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.45rem 0.75rem', color: C.text, fontSize: '0.83rem', outline: 'none' }}>
              {FONTS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {type === 'subathon'
              ? <RangeInput label="Tamanho do cronômetro" value={style.timerSize} min={24} max={120} unit="px" onChange={v => upS('timerSize', v)} />
              : <RangeInput label="Tamanho do título" value={style.titleSize} min={8} max={36} unit="px" onChange={v => upS('titleSize', v)} />}
            <RangeInput label="Textos de apoio" value={style.supportSize} min={7} max={24} unit="px" onChange={v => upS('supportSize', v)} />
          </div>
          {type === 'subathon' && (
            <RangeInput label="Tamanho do título" value={style.titleSize} min={8} max={28} unit="px" onChange={v => upS('titleSize', v)} />
          )}
        </Collapse>

        <Collapse title="Dimensões" open={exp.dimensoes} onToggle={() => setExp(e => ({ ...e, dimensoes: !e.dimensoes }))}>
          <RangeInput label="Largura horizontal" value={style.width} min={100} max={1920} unit="px" onChange={v => upS('width', v)} />
          {isBarType && <RangeInput label="Espessura da barra" value={style.barThickness} min={2} max={24} unit="px" onChange={v => upS('barThickness', v)} />}
        </Collapse>

        <Collapse title="Cores" open={exp.cores} onToggle={() => setExp(e => ({ ...e, cores: !e.cores }))}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
            <ColorIn label="Cor do texto" value={style.textColor} onChange={v => upS('textColor', v)} />
            {type === 'subathon'
              ? <ColorIn label="Cor do cronômetro" value={style.timerColor} onChange={v => upS('timerColor', v)} />
              : <ColorIn label="Cor da barra" value={style.barColor} onChange={v => upS('barColor', v)} />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
            <ColorIn label="Fundo" value={style.bgColor} onChange={v => upS('bgColor', v)} />
            {isBarType && <ColorIn label="Fundo da barra" value={style.barBg} onChange={v => upS('barBg', v)} />}
          </div>
          <RangeInput label="Opacidade do fundo" value={Math.round(style.bgOpacity * 100)} min={0} max={100} unit="%" onChange={v => upS('bgOpacity', v / 100)} />
        </Collapse>

        <Collapse title="Borda" open={exp.borda} onToggle={() => setExp(e => ({ ...e, borda: !e.borda }))}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: C.text }}>Adicionar contorno ao overlay</span>
            <div onClick={() => upS('border', !style.border)} style={{ width: 34, height: 19, background: style.border ? C.primary : 'rgba(255,255,255,0.12)', borderRadius: 10, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: style.border ? 16 : 2, width: 15, height: 15, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
            </div>
          </div>
          {style.border && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <ColorIn label="Cor da borda" value={style.borderColor} onChange={v => upS('borderColor', v)} />
              <RangeInput label="Espessura" value={style.borderThick} min={1} max={10} unit="px" onChange={v => upS('borderThick', v)} />
              <RangeInput label="Raio" value={style.borderRadius} min={0} max={40} unit="px" onChange={v => upS('borderRadius', v)} />
            </div>
          )}
        </Collapse>

        {/* Layout */}
        <div style={{ padding: '0.75rem 0', borderTop: `1px solid ${C.cardB}` }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Layout</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ padding: '0.65rem 1rem', background: C.primaryBg, border: `1px solid ${C.primaryB}`, borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.primary, marginBottom: '0.15rem' }}>Padrão</div>
              <div style={{ fontSize: '0.72rem', color: C.muted }}>Visual configurável</div>
            </div>
            <div style={{ padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardB}`, borderRadius: 8, cursor: 'not-allowed', opacity: 0.5 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.dim, marginBottom: '0.15rem' }}>Personalizado</div>
              <div style={{ fontSize: '0.72rem', color: C.vdim }}>HTML / CSS / JS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset catalog */}
      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Catálogo de estilos</span>
        </div>
        <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: C.dim }}>Selecione um preset para aplicar ao overlay — personalize depois</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
          {PRESETS.map(p => (
            <PresetCard key={p.id} p={p} active={activePreset === p.id} onClick={() => applyPreset(p)} />
          ))}
        </div>
      </div>
    </div>
  )
}
