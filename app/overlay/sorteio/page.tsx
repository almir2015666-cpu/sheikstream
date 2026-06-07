'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type SorteioState = {
  id: string
  title: string
  type: string
  status: string
  winner_username: string | null
  participant_count: number
}

function SorteioOverlayContent() {
  const sp = useSearchParams()
  const uid = sp.get('uid') ?? ''
  const [data, setData] = useState<SorteioState | null>(null)
  const [prevWinner, setPrevWinner] = useState<string | null>(null)
  const [showWinner, setShowWinner] = useState(false)

  useEffect(() => {
    if (!uid) return
    const load = () =>
      fetch(`/api/overlay/sorteio?uid=${uid}`)
        .then(r => r.json())
        .then(d => {
          setData(d)
          if (d?.winner_username && d.winner_username !== prevWinner) {
            setPrevWinner(d.winner_username)
            setShowWinner(true)
            setTimeout(() => setShowWinner(false), 8000)
          }
        })
        .catch(() => {})
    load()
    const iv = setInterval(load, 3000)
    return () => clearInterval(iv)
  }, [uid])

  if (!data) return null

  const typeLabel: Record<string, string> = { all: 'Todos', subs: 'Subs', follows: 'Seguidores', keyword: 'Palavra-chave' }

  if (showWinner && data.winner_username) {
    return (
      <div style={{
        fontFamily: "-apple-system,'Inter',system-ui,sans-serif",
        padding: '22px 36px',
        background: 'linear-gradient(135deg,rgba(11,12,23,0.95),rgba(155,48,255,0.15))',
        borderRadius: '16px',
        border: '1px solid rgba(155,48,255,0.5)',
        textAlign: 'center',
        minWidth: '400px',
        animation: 'fadeIn 0.4s ease',
        boxShadow: '0 0 40px rgba(155,48,255,0.3)',
      }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9b30ff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Vencedor do sorteio</div>
        <div style={{ fontSize: '0.85rem', color: 'rgba(232,230,248,0.55)', marginBottom: '6px' }}>{data.title}</div>
        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#39ff14', letterSpacing: '-0.5px', textShadow: '0 0 20px rgba(57,255,20,0.5)' }}>
          🏆 {data.winner_username}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: "-apple-system,'Inter',system-ui,sans-serif",
      padding: '14px 24px',
      background: 'rgba(11,12,23,0.92)',
      borderRadius: '12px',
      border: '1px solid rgba(155,48,255,0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      minWidth: '360px',
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9b30ff" strokeWidth="1.8"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.78rem', color: 'rgba(232,230,248,0.45)', marginBottom: '2px' }}>Sorteio {data.status === 'active' ? '• AO VIVO' : ''}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8e6f8' }}>{data.title}</div>
        <div style={{ fontSize: '0.7rem', color: '#9b30ff', marginTop: '2px' }}>{typeLabel[data.type] ?? data.type}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#39ff14', lineHeight: 1 }}>{data.participant_count}</div>
        <div style={{ fontSize: '0.63rem', color: 'rgba(232,230,248,0.4)', marginTop: '2px' }}>participantes</div>
      </div>
    </div>
  )
}

export default function SorteioOverlayPage() {
  return (
    <>
      <style>{`html,body{margin:0;padding:0;background:transparent!important;}`}</style>
      <div style={{ padding: '12px' }}>
        <Suspense fallback={null}>
          <SorteioOverlayContent />
        </Suspense>
      </div>
    </>
  )
}
