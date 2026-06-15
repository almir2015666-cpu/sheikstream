'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { CatalogItem } from '@/app/api/admin/overlays-catalog/route'

function itemStatus(item: CatalogItem): 'live' | 'soon' | 'maintenance' {
  if (item.status) return item.status
  return item.live ? 'live' : 'soon'
}

export default function OverlaysLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    // Only protect sub-pages (not the catalog index itself)
    if (pathname === '/dashboard/overlays') { setChecked(true); return }

    Promise.all([
      fetch('/api/admin/overlays-catalog').then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/api/me/role').then(r => r.ok ? r.json() : { roles: [] }).catch(() => ({ roles: [] })),
    ]).then(([catalog, roleData]) => {
      const isAdmin: boolean = (roleData?.roles ?? []).includes('admin')
      if (isAdmin) { setChecked(true); return }

      // Extract the last path segment as the overlay type
      const segment = pathname.split('/').pop() ?? ''
      const items: CatalogItem[] = catalog?.items ?? []
      const match = items.find(i => {
        const hrefSegment = (i.href || '').split('/').pop() ?? ''
        return i.type === segment || hrefSegment === segment
      })

      if (match && itemStatus(match) === 'maintenance') {
        setBlocked(true)
      }
      setChecked(true)
    })
  }, [pathname])

  if (!checked) return null

  if (blocked) {
    return (
      <div style={{ background: '#08090d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 360, padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.5rem' }}>Em Manutenção</div>
          <p style={{ color: 'rgba(232,230,248,0.5)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Este overlay está temporariamente indisponível. Volte em breve.
          </p>
          <button onClick={() => router.push('/dashboard/overlays')}
            style={{ padding: '0.6rem 1.4rem', background: 'rgba(155,48,255,0.12)', border: '1px solid rgba(155,48,255,0.3)', color: '#9b30ff', borderRadius: 9, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
            ← Voltar aos Overlays
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
