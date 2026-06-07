'use client'
import { useState } from 'react'

export default function Home() {
  const [page, setPage] = useState('landing')
  const [loading, setLoading] = useState('')

  function handleOAuth(platform: string) {
    setLoading(platform)
    setTimeout(() => setLoading(''), 2000)
  }

  if (page === 'login') {
    return (
      <div style={{ fontFamily: 'sans-serif', background: '#08090d', minHeight: '100vh', color: '#f0eefc' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid rgba(155,48,255,0.18)', background: 'rgba(8,9,13,0.97)' }}>
          <div onClick={() => setPage('landing')} style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer' }}>
            Sheik<span style={{ color: '#39ff14' }}>stream</span>
          </div>
          <button onClick={() => setPage('landing')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(240,238,252,0.7)', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Voltar
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(155,48,255,0.3)', borderTop: '2px solid #9b30ff', borderRadius: '14px', padding: '2.2rem', width: '100%', maxWidth: '410px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '1px' }}>
                Sheik<span style={{ color: '#39ff14' }}>stream</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(240,238,252,0.45)', marginTop: '0.3rem' }}>
                Conecte sua plataforma e entre no hub
              </div>
            </div>

            {[
              { id: 'Twitch', color: '#9147ff', bg: 'rgba(145,71,255,0.1)', label: 'Entrar com Twitch' },
              { id: 'YouTube', color: '#ff0000', bg: 'rgba(255,0,0,0.08)', label: 'Entrar com YouTube' },
              { id: 'Kick', color: '#53fc18', bg: 'rgba(83,252,24,0.08)', label: 'Entrar com Kick' },
              { id: 'Discord', color: '#5865f2', bg: 'rgba(88,101,242,0.1)', label: 'Entrar com Discord' },
              { id: 'Google', color: '#4285f4', bg: 'rgba(66,133,244,0.08)', label: 'Entrar com Google' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleOAuth(p.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.7rem 1rem', borderRadius: '8px', marginBottom: '0.6rem',
                  border: `1px solid ${loading === p.id ? p.color : 'rgba(255,255,255,0.1)'}`,
                  background: loading === p.id ? p.bg : 'rgba(255,255,255,0.03)',
                  color: 'rgba(240,238,252,0.85)', fontSize: '0.9rem', fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: p.id === 'Kick' ? '#53fc18' : p.id === 'Google' ? '#fff' : p.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{loading === p.id ? 'Conectando...' : p.label}</span>
                <span style={{ color: 'rgba(240,238,252,0.2)', fontSize: '13px' }}>›</span>
              </button>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '0.75rem', color: 'rgba(240,238,252,0.25)' }}>ou entre com e-mail</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <input
              type="email"
              placeholder="seu@email.com"
              style={{ width: '100%', padding: '0.7rem 1rem', background: '#08090d', border: '1px solid rgba(155,48,255,0.3)', borderRadius: '8px', color: '#f0eefc', fontSize: '0.9rem', outline: 'none', marginBottom: '0.6rem', boxSizing: 'border-box' }}
            />
            <button style={{ width: '100%', padding: '0.72rem', background: '#9b30ff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
              Entrar com e-mail
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: 'rgba(240,238,252,0.3)' }}>
              Não tem conta?{' '}
              <span style={{ color: '#9b30ff', cursor: 'pointer' }}>Criar conta grátis</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#08090d', minHeight: '100vh', color: '#f0eefc' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid rgba(155,48,255,0.18)', background: 'rgba(8,9,13,0.97)' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '1px' }}>
          Sheik<span style={{ color: '#39ff14' }}>stream</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span style={{ color: 'rgba(240,238,252,0.45)', fontSize: '0.9rem', cursor: 'pointer' }}>Produto</span>
          <span style={{ color: 'rgba(240,238,252,0.45)', fontSize: '0.9rem', cursor: 'pointer' }}>Preços</span>
          <button onClick={() => setPage('login')} style={{ background: '#9b30ff', color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
            Entrar
          </button>
          <button onClick={() => setPage('login')} style={{ background: '#39ff14', color: '#000', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
            Começar grátis
          </button>
        </div>
      </nav>

      <div style={{ textAlign: 'center', padding: '5rem 2rem 3rem', borderTop: '3px solid', borderImage: 'linear-gradient(90deg,#9b30ff,#39ff14,#9b30ff) 1' }}>
        <div style={{ display: 'inline-block', background: 'rgba(46,13,92,0.6)', border: '1px solid #6b1fc2', color: '#c98fff', fontSize: '0.75rem', padding: '0.28rem 0.9rem', borderRadius: '999px', marginBottom: '1.4rem', letterSpacing: '0.5px' }}>
          ● Hub para streamers brasileiros
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1px', marginBottom: '1rem' }}>
          Gerencie <span style={{ color: '#39ff14' }}>Twitch</span>,{' '}
          <span style={{ color: '#9b30ff' }}>Kick</span><br />e muito mais
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(240,238,252,0.5)', maxWidth: '500px', margin: '0 auto 2.2rem', lineHeight: 1.7, fontWeight: 300 }}>
          Conecte todas as suas plataformas, automatize sorteios, acompanhe metas e engaje sua comunidade — tudo num só lugar.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setPage('login')} style={{ background: '#39ff14', color: '#000', border: 'none', padding: '0.75rem 2rem', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}>
            Criar conta grátis
          </button>
          <button style={{ background: 'transparent', color: 'rgba(240,238,252,0.7)', border: '1px solid rgba(255,255,255,0.18)', padding: '0.75rem 1.6rem', borderRadius: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
            Ver demo
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.7rem', flexWrap: 'wrap', padding: '0 2rem 3rem' }}>
        {['Twitch', 'YouTube', 'Kick', 'TikTok', 'Facebook'].map((p) => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f1018', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.82rem', color: 'rgba(240,238,252,0.55)' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: p === 'Twitch' ? '#9147ff' : p === 'YouTube' ? '#ff0000' : p === 'Kick' ? '#53fc18' : p === 'TikTok' ? '#333' : '#1877f2' }} />
            {p}
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: 'rgba(155,48,255,0.18)', margin: '0 2rem' }} />

      <section style={{ padding: '3rem 2rem', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.72rem', letterSpacing: '2px', color: '#39ff14', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Recursos</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f0eefc', marginBottom: '2rem', letterSpacing: '-0.5px' }}>Feito pra quem vive de stream</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', border: '1px solid rgba(155,48,255,0.18)', borderRadius: '12px', overflow: 'hidden' }}>
          {[
            { icon: '◈', title: 'Painel Unificado', desc: 'Todas as métricas das suas plataformas em tempo real numa só tela.', green: true },
            { icon: '◎', title: 'Gerenciamento de Metas', desc: 'Defina e acompanhe metas de seguidores, subs e doações ao vivo.', green: false },
            { icon: '✦', title: 'Sorteios e Eventos', desc: 'Crie sorteios automáticos que deixam o chat em chamas.', green: true },
            { icon: '◉', title: 'Notificações em Tempo Real', desc: 'Avise sua comunidade no segundo exato que você entrar ao vivo.', green: false },
            { icon: '▲', title: 'Analytics Avançados', desc: 'Descubra o que retém seu público — e o que faz ele sair.', green: true },
            { icon: '⬡', title: 'Bot de Automação', desc: 'Automatize moderação, comandos e respostas do chat sem esforço.', green: false },
          ].map((f) => (
            <div key={f.title} style={{ background: '#0f1018', padding: '1.4rem', borderRight: '1px solid rgba(155,48,255,0.15)', borderBottom: '1px solid rgba(155,48,255,0.15)' }}>
              <div style={{ width: '34px', height: '34px', background: f.green ? 'rgba(57,255,20,0.1)' : 'rgba(155,48,255,0.15)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem', fontSize: '16px', color: f.green ? '#39ff14' : '#c98fff' }}>
                {f.icon}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f0eefc', marginBottom: '0.35rem' }}>{f.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(240,238,252,0.45)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ margin: '0 2rem 3rem', background: '#0f1018', borderLeft: '3px solid #9b30ff', borderRadius: '0 12px 12px 0', border: '1px solid rgba(155,48,255,0.3)', borderLeftWidth: '3px', padding: '2.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f0eefc', marginBottom: '0.3rem' }}>
            Pronto pra centralizar tudo? <span style={{ background: 'rgba(57,255,20,0.15)', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14', fontSize: '0.7rem', padding: '0.18rem 0.65rem', borderRadius: '999px', fontWeight: 700, marginLeft: '0.4rem', verticalAlign: 'middle' }}>BETA</span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'rgba(240,238,252,0.45)' }}>Conecte suas plataformas em menos de 2 minutos e comece a crescer.</p>
        </div>
        <button onClick={() => setPage('login')} style={{ background: '#39ff14', color: '#000', border: 'none', padding: '0.75rem 2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Criar conta grátis →
        </button>
      </div>
    </div>
  )
}
