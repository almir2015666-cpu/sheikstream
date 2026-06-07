'use client'
import { useState } from 'react'
import Link from 'next/link'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)', cardAlt: '#0f1018',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 1rem', background: '#08090d', border: '1px solid rgba(155,48,255,0.22)', borderRadius: '8px', color: '#e8e6f8', fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: '0.76rem', fontWeight: 600, color: 'rgba(232,230,248,0.55)', marginBottom: '0.38rem', display: 'block' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
      <div style={{ padding: '0.85rem 1.3rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.76rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{title}</div>
      <div style={{ padding: '1.3rem' }}>{children}</div>
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '0.5rem' }}>
      <div>
        <div style={{ fontSize: '0.83rem', fontWeight: 600, color: C.text }}>{label}</div>
        {desc && <div style={{ fontSize: '0.7rem', color: C.dim, marginTop: '0.12rem' }}>{desc}</div>}
      </div>
      <div onClick={onChange} style={{ width: '34px', height: '18px', borderRadius: '999px', background: checked ? C.primary : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '2px', left: checked ? '18px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
      </div>
    </div>
  )
}

type Img = { url: string; ativa: boolean; corFundo: number; duracao: number; transicaoEntrada: string }

export default function NovoBannerPage() {
  const [nome, setNome] = useState('')
  const [imgs, setImgs] = useState<Img[]>([{ url: '', ativa: true, corFundo: 50, duracao: 10, transicaoEntrada: 'Fade In' }])
  const [etiqueta, setEtiqueta] = useState(false)
  const [cooldown, setCooldown] = useState(5)
  const [intervaloAleatorio, setIntervaloAleatorio] = useState(false)
  const [transicaoSaida, setTransicaoSaida] = useState('Fade Out')
  const [vis, setVis] = useState({ habilitado: true, meta: true, sorteio: true, metaSubs: false, subathon: false, patrocinadores: true })

  function addImg() {
    setImgs(p => [...p, { url: '', ativa: true, corFundo: 50, duracao: 10, transicaoEntrada: 'Fade In' }])
  }

  function updateImg(i: number, patch: Partial<Img>) {
    setImgs(p => p.map((img, idx) => idx === i ? { ...img, ...patch } : img))
  }

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/dashboard/banners" style={{ color: C.dim, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Banners
          </Link>
          <span style={{ color: C.vdim }}>/</span>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Novo Banner</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href="/dashboard/banners" style={{ padding: '0.5rem 1.2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: C.dim, borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            Cancelar
          </Link>
          <button style={{ padding: '0.5rem 1.5rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            Salvar banners
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', maxWidth: '1100px', alignItems: 'start' }}>
        <div>
          {/* Nome */}
          <Section title="Identificação">
            <label style={labelStyle}>Nome do patrocinador / campanha</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Patrocinador Principal" style={inputStyle} />
          </Section>

          {/* Imagens */}
          <Section title="Imagens do banner">
            {imgs.map((img, i) => (
              <div key={i} style={{ background: C.cardAlt, borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: C.dim }}>Imagem {i + 1}</span>
                  {imgs.length > 1 && (
                    <button onClick={() => setImgs(p => p.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.78rem' }}>Remover</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>URL da imagem</label>
                    <input value={img.url} onChange={e => updateImg(i, { url: e.target.value })} placeholder="https://..." style={inputStyle} />
                  </div>
                  <div style={{ paddingTop: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div onClick={() => updateImg(i, { ativa: !img.ativa })} style={{ width: '34px', height: '18px', borderRadius: '999px', background: img.ativa ? C.primary : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '2px', left: img.ativa ? '18px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: C.dim }}>Ativa</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Cor de fundo ({img.corFundo}%)</label>
                    <input type="range" min={0} max={100} value={img.corFundo} onChange={e => updateImg(i, { corFundo: Number(e.target.value) })} style={{ width: '100%', accentColor: C.primary }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Transição de entrada</label>
                    <select value={img.transicaoEntrada} onChange={e => updateImg(i, { transicaoEntrada: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {['Fade In', 'Slide Left', 'Slide Right', 'Zoom In', 'None'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Duração ({img.duracao}s)</label>
                    <input type="range" min={3} max={60} value={img.duracao} onChange={e => updateImg(i, { duracao: Number(e.target.value) })} style={{ width: '100%', accentColor: C.primary }} />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addImg} style={{ width: '100%', padding: '0.65rem', background: 'transparent', border: `1px dashed rgba(155,48,255,0.3)`, color: C.primary, borderRadius: '8px', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}>
              + Adicionar imagem
            </button>
          </Section>

          {/* Configurações gerais */}
          <Section title="Configurações gerais">
            <div style={{ marginBottom: '1rem' }}>
              <Toggle label="Etiqueta de apoio (flag)" desc="Exibe 'Apoiado por' no canto do banner" checked={etiqueta} onChange={() => setEtiqueta(p => !p)} />
              <Toggle label="Intervalo aleatório" desc="Exibe o banner em momentos aleatórios do ciclo" checked={intervaloAleatorio} onChange={() => setIntervaloAleatorio(p => !p)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Cooldown entre ciclos ({cooldown} min)</label>
                <input type="range" min={1} max={60} value={cooldown} onChange={e => setCooldown(Number(e.target.value))} style={{ width: '100%', accentColor: C.primary }} />
              </div>
              <div>
                <label style={labelStyle}>Transição de saída</label>
                <select value={transicaoSaida} onChange={e => setTransicaoSaida(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {['Fade Out', 'Slide Left', 'Slide Right', 'Zoom Out', 'None'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </Section>

          {/* Visibilidade */}
          <Section title="Visibilidade nos overlays">
            <Toggle label="Banner habilitado" desc="Ativa ou desativa o banner globalmente" checked={vis.habilitado} onChange={() => setVis(p => ({ ...p, habilitado: !p.habilitado }))} />
            <Toggle label="Exibir no overlay de meta" checked={vis.meta} onChange={() => setVis(p => ({ ...p, meta: !p.meta }))} />
            <Toggle label="Exibir no overlay de sorteio" checked={vis.sorteio} onChange={() => setVis(p => ({ ...p, sorteio: !p.sorteio }))} />
            <Toggle label="Exibir no overlay de Meta de Subs" checked={vis.metaSubs} onChange={() => setVis(p => ({ ...p, metaSubs: !p.metaSubs }))} />
            <Toggle label="Exibir no overlay de Subathon" checked={vis.subathon} onChange={() => setVis(p => ({ ...p, subathon: !p.subathon }))} />
            <Toggle label="Incluir no Overlay patrocinadores" checked={vis.patrocinadores} onChange={() => setVis(p => ({ ...p, patrocinadores: !p.patrocinadores }))} />
          </Section>
        </div>

        {/* Preview lateral */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.74rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
              Pré-visualização ao vivo
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Overlay Meta',           w: 268, h: 100 },
                { label: 'Overlay Sorteio',        w: 268, h: 100 },
                { label: 'Overlay Patrocinadores', w: 268, h: 100 },
              ].map(ov => (
                <div key={ov.label}>
                  <div style={{ fontSize: '0.7rem', color: C.vdim, marginBottom: '0.35rem', fontWeight: 600 }}>{ov.label}</div>
                  <div style={{ width: '100%', height: ov.h, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {imgs[0]?.url ? (
                      <img src={imgs[0].url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: C.vdim }}>Sem imagem</span>
                    )}
                  </div>
                  <button style={{ marginTop: '0.4rem', width: '100%', padding: '0.35rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: C.dim, borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    Abrir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
