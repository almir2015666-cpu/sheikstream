'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { notify } from '@/app/lib/notify'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  green: '#39ff14', greenBg: 'rgba(57,255,20,0.1)', greenB: 'rgba(57,255,20,0.25)',
}

type Banner = {
  id: string; nome: string; habilitado: boolean; imgs: { url: string }[]
  etiqueta: boolean; cooldown: number; created_at: string
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/banners')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBanners(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function toggleHabilitado(b: Banner) {
    const next = !b.habilitado
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, habilitado: next } : x))
    const res = await fetch(`/api/banners/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habilitado: next }),
    })
    if (!res.ok) {
      setBanners(prev => prev.map(x => x.id === b.id ? { ...x, habilitado: b.habilitado } : x))
      notify('Erro ao atualizar banner', 'error')
    } else {
      notify(next ? 'Banner habilitado' : 'Banner desabilitado', 'success')
    }
  }

  async function removeBanner(b: Banner) {
    if (!confirm(`Remover banner "${b.nome}"?`)) return
    setBanners(prev => prev.filter(x => x.id !== b.id))
    const res = await fetch(`/api/banners/${b.id}`, { method: 'DELETE' })
    if (!res.ok) {
      notify('Erro ao remover banner', 'error')
      fetch('/api/banners').then(r => r.json()).then(d => { if (Array.isArray(d)) setBanners(d) })
    } else {
      notify('Banner removido', 'success')
    }
  }

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Banners de patrocinadores</h2>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: 'rgba(59,130,246,0.18)', color: '#60a5fa', borderRadius: '999px', letterSpacing: '0.5px' }}>NOVO</span>
        </div>
        <Link href="/dashboard/banners/novo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem', background: C.primary, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
          + Novo banner
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: C.dim }}>Carregando...</div>
      ) : banners.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>🖼️</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: '0.5rem' }}>Nenhum banner cadastrado</div>
          <div style={{ fontSize: '0.84rem', color: C.dim, marginBottom: '1.5rem' }}>Adicione banners de patrocinadores para exibir nos seus overlays do OBS</div>
          <Link href="/dashboard/banners/novo" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.5rem', background: C.primary, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700 }}>
            Criar primeiro banner
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {banners.map(b => (
            <div key={b.id} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1rem 1.3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Thumb */}
              <div style={{ width: 64, height: 40, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {b.imgs?.[0]?.url
                  ? <img src={b.imgs[0].url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: '1.2rem', opacity: 0.3 }}>🖼️</span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.nome}</div>
                <div style={{ fontSize: '0.73rem', color: C.dim }}>
                  {b.imgs?.length ?? 0} imagem{(b.imgs?.length ?? 0) !== 1 ? 's' : ''} · Cooldown {b.cooldown} min{b.etiqueta ? ' · Etiqueta ativa' : ''}
                </div>
              </div>

              {/* Toggle habilitado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', color: b.habilitado ? C.green : C.dim }}>{b.habilitado ? 'Ativo' : 'Inativo'}</span>
                <div onClick={() => toggleHabilitado(b)} style={{ width: 34, height: 18, borderRadius: 999, background: b.habilitado ? C.green : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: b.habilitado ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
                </div>
              </div>

              {/* Remove */}
              <button onClick={() => removeBanner(b)} style={{ background: 'transparent', border: '1px solid rgba(255,68,68,0.25)', color: '#ff4444', borderRadius: 7, padding: '0.35rem 0.75rem', fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0 }}>
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
