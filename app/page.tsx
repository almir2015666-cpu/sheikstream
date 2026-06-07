'use client'
import { useState } from 'react'
import {
  SiTwitch, SiYoutube, SiKick, SiTiktok, SiFacebook,
  SiDiscord, SiInstagram, SiGoogle, SiX, SiWhatsapp,
} from 'react-icons/si'
import type { IconType } from 'react-icons'

const PLATFORM_ICONS: Record<string, IconType> = {
  Twitch: SiTwitch,
  YouTube: SiYoutube,
  Kick: SiKick,
  TikTok: SiTiktok,
  Facebook: SiFacebook,
  Discord: SiDiscord,
  Instagram: SiInstagram,
  Google: SiGoogle,
  X: SiX,
  WhatsApp: SiWhatsapp,
}

function PIcon({ id, color, size = 18 }: { id: string; color: string; size?: number }) {
  const Icon = PLATFORM_ICONS[id]
  if (!Icon) return null
  return <Icon size={size} color={color} />
}

export default function Home() {
  const [page, setPage] = useState('landing')
  const [loading, setLoading] = useState('')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistDone, setWaitlistDone] = useState(false)

  function handleOAuth(platform: string) {
    setLoading(platform)
    setTimeout(() => setLoading(''), 2000)
  }

  function handleWaitlistSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (waitlistEmail.trim()) setWaitlistDone(true)
  }

  // ── WAITLIST PAGE ────────────────────────────────────────────────────────────
  if (page === 'waitlist') {
    return (
      <div style={{ fontFamily: 'sans-serif', background: '#08090d', minHeight: '100vh', color: '#f0eefc' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid rgba(155,48,255,0.18)', background: 'rgba(8,9,13,0.97)' }}>
          <div onClick={() => { setPage('landing'); setWaitlistDone(false); setWaitlistEmail('') }} style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer' }}>
            Sheik<span style={{ color: '#39ff14' }}>stream</span>
          </div>
          <button onClick={() => { setPage('landing'); setWaitlistDone(false); setWaitlistEmail('') }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(240,238,252,0.7)', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Voltar
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
          {!waitlistDone ? (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(155,48,255,0.3)', borderTop: '2px solid #9b30ff', borderRadius: '14px', padding: '2.5rem 2rem', width: '100%', maxWidth: '440px', textAlign: 'center' }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '12px', background: 'rgba(155,48,255,0.12)', border: '1px solid rgba(155,48,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.7rem' }}>
                ⏳
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, marginBottom: '0.5rem' }}>Lista de espera</h1>
              <p style={{ fontSize: '0.88rem', color: 'rgba(240,238,252,0.5)', lineHeight: 1.7, maxWidth: '320px', margin: '0 auto 2rem' }}>
                O Sheikstream está em beta fechado. Cadastre seu e-mail e avisamos quando sua vaga abrir.
              </p>
              <form onSubmit={handleWaitlistSubmit}>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={waitlistEmail}
                  onChange={e => setWaitlistEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: '#08090d', border: '1px solid rgba(155,48,255,0.35)', borderRadius: '8px', color: '#f0eefc', fontSize: '0.9rem', outline: 'none', marginBottom: '0.75rem', boxSizing: 'border-box' }}
                />
                <button type="submit" style={{ width: '100%', padding: '0.8rem', background: '#9b30ff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}>
                  Garantir minha vaga grátis
                </button>
              </form>
              <p style={{ marginTop: '1.2rem', fontSize: '0.75rem', color: 'rgba(240,238,252,0.22)' }}>
                Sem spam. Apenas um aviso quando sua vaga abrir.
              </p>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(57,255,20,0.25)', borderTop: '2px solid #39ff14', borderRadius: '14px', padding: '2.5rem 2rem', width: '100%', maxWidth: '440px', textAlign: 'center' }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem', fontSize: '1.7rem', color: '#39ff14' }}>
                ✓
              </div>
              <div style={{ display: 'inline-block', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14', fontSize: '0.68rem', padding: '0.22rem 0.8rem', borderRadius: '999px', marginBottom: '1.2rem', fontWeight: 700, letterSpacing: '1px' }}>
                VOCÊ ESTÁ NA FILA
              </div>
              <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#39ff14', lineHeight: 1, marginBottom: '0.2rem' }}>#247</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(240,238,252,0.4)', marginBottom: '1.5rem' }}>sua posição na fila de espera</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Cadastro confirmado!</h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(240,238,252,0.5)', lineHeight: 1.7, marginBottom: '2rem' }}>
                Avisamos em <strong style={{ color: '#f0eefc' }}>{waitlistEmail}</strong> assim que sua vaga abrir.
              </p>
              <div style={{ background: 'rgba(155,48,255,0.07)', border: '1px solid rgba(155,48,255,0.18)', borderRadius: '10px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(240,238,252,0.38)', marginBottom: '0.7rem' }}>Indique amigos e avance na fila</div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Twitter / X', id: 'X', color: '#e7e9ea' },
                    { label: 'Discord', id: 'Discord', color: '#5865f2' },
                    { label: 'WhatsApp', id: 'WhatsApp', color: '#25d366' },
                  ].map(s => (
                    <button key={s.id} style={{ padding: '0.4rem 0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(240,238,252,0.65)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <PIcon id={s.id} color={s.color} size={13} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setPage('landing'); setWaitlistDone(false); setWaitlistEmail('') }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(240,238,252,0.55)', padding: '0.6rem 1.5rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Voltar ao início
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── LOGIN PAGE ───────────────────────────────────────────────────────────────
  if (page === 'login') {
    const oauthPlatforms = [
      { id: 'Twitch',  color: '#9147ff', bg: 'rgba(145,71,255,0.1)',  label: 'Entrar com Twitch' },
      { id: 'YouTube', color: '#ff0000', bg: 'rgba(255,0,0,0.08)',    label: 'Entrar com YouTube' },
      { id: 'Kick',    color: '#53fc18', bg: 'rgba(83,252,24,0.08)',  label: 'Entrar com Kick' },
      { id: 'Discord', color: '#5865f2', bg: 'rgba(88,101,242,0.1)',  label: 'Entrar com Discord' },
      { id: 'Google',  color: '#4285f4', bg: 'rgba(66,133,244,0.08)', label: 'Entrar com Google' },
    ]

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

            {oauthPlatforms.map((p) => (
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
                <span style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PIcon id={p.id} color={p.color} size={20} />
                </span>
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
              <span onClick={() => setPage('waitlist')} style={{ color: '#9b30ff', cursor: 'pointer' }}>Criar conta grátis</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── LANDING PAGE ─────────────────────────────────────────────────────────────
  const heroPlatforms = [
    { id: 'Twitch',   color: '#9147ff' },
    { id: 'YouTube',  color: '#ff0000' },
    { id: 'Kick',     color: '#53fc18' },
    { id: 'TikTok',   color: '#f0eefc' },
    { id: 'Facebook', color: '#1877f2' },
  ]

  const socialLinks = [
    { id: 'X',         name: 'Twitter / X', color: '#e7e9ea' },
    { id: 'Discord',   name: 'Discord',     color: '#5865f2' },
    { id: 'Twitch',    name: 'Twitch',      color: '#9147ff' },
    { id: 'Instagram', name: 'Instagram',   color: '#e1306c' },
    { id: 'YouTube',   name: 'YouTube',     color: '#ff0000' },
    { id: 'TikTok',    name: 'TikTok',      color: '#f0eefc' },
  ]

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#08090d', minHeight: '100vh', color: '#f0eefc', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
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
          <button onClick={() => setPage('waitlist')} style={{ background: '#39ff14', color: '#000', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
            Começar grátis
          </button>
        </div>
      </nav>

      {/* Hero */}
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
          <button onClick={() => setPage('waitlist')} style={{ background: '#39ff14', color: '#000', border: 'none', padding: '0.75rem 2rem', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}>
            Criar conta grátis
          </button>
          <button style={{ background: 'transparent', color: 'rgba(240,238,252,0.7)', border: '1px solid rgba(255,255,255,0.18)', padding: '0.75rem 1.6rem', borderRadius: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
            Ver demo
          </button>
        </div>
      </div>

      {/* Platform badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.7rem', flexWrap: 'wrap', padding: '0 2rem 3rem' }}>
        {heroPlatforms.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f1018', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.82rem', color: 'rgba(240,238,252,0.55)' }}>
            <PIcon id={p.id} color={p.color} size={14} />
            {p.id}
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: 'rgba(155,48,255,0.18)', margin: '0 2rem' }} />

      {/* Features */}
      <section style={{ padding: '3rem 2rem', maxWidth: '860px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
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

      {/* Pricing */}
      <section style={{ padding: '1rem 2rem 4rem', maxWidth: '860px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '0.72rem', letterSpacing: '2px', color: '#39ff14', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Preços</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f0eefc', marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>Comece de graça, sempre</h2>
        <p style={{ fontSize: '0.88rem', color: 'rgba(240,238,252,0.4)', marginBottom: '2.5rem' }}>Sem cartão de crédito. Sem surpresas.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {/* Free plan */}
          <div style={{ background: '#0f1018', border: '1px solid rgba(57,255,20,0.35)', borderRadius: '14px', padding: '2rem' }}>
            <div style={{ display: 'inline-block', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14', fontSize: '0.67rem', padding: '0.2rem 0.75rem', borderRadius: '999px', fontWeight: 700, marginBottom: '1.2rem', letterSpacing: '0.5px' }}>
              DISPONÍVEL AGORA
            </div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.2rem' }}>R$0</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(240,238,252,0.38)', marginBottom: '1.8rem' }}>/mês, para sempre</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {[
                'Até 3 plataformas conectadas',
                'Painel unificado em tempo real',
                'Sorteios ilimitados',
                'Metas de seguidores e subs',
                'Notificações ao vivo',
                'Suporte pela comunidade Discord',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.85rem', color: 'rgba(240,238,252,0.75)' }}>
                  <span style={{ color: '#39ff14', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => setPage('waitlist')} style={{ width: '100%', padding: '0.8rem', background: '#39ff14', color: '#000', border: 'none', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer' }}>
              Garantir acesso grátis →
            </button>
          </div>

          {/* Pro plan – coming soon */}
          <div style={{ background: '#0f1018', border: '1px solid rgba(155,48,255,0.2)', borderRadius: '14px', padding: '2rem', opacity: 0.65 }}>
            <div style={{ display: 'inline-block', background: 'rgba(155,48,255,0.1)', border: '1px solid rgba(155,48,255,0.22)', color: '#c98fff', fontSize: '0.67rem', padding: '0.2rem 0.75rem', borderRadius: '999px', fontWeight: 700, marginBottom: '1.2rem', letterSpacing: '0.5px' }}>
              EM BREVE
            </div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.2rem', color: 'rgba(240,238,252,0.45)' }}>R$19</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(240,238,252,0.25)', marginBottom: '1.8rem' }}>/mês</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {[
                'Plataformas ilimitadas',
                'Analytics com histórico completo',
                'Bot de automação avançado',
                'Integração com OBS e StreamElements',
                'Acesso à API',
                'Suporte prioritário',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.85rem', color: 'rgba(240,238,252,0.35)' }}>
                  <span style={{ color: 'rgba(155,48,255,0.45)', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button disabled style={{ width: '100%', padding: '0.8rem', background: 'rgba(155,48,255,0.08)', color: 'rgba(240,238,252,0.25)', border: '1px solid rgba(155,48,255,0.15)', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 700, cursor: 'not-allowed' }}>
              Em breve
            </button>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div style={{ margin: '0 2rem 4rem', background: '#0f1018', borderLeft: '3px solid #9b30ff', borderRadius: '0 12px 12px 0', border: '1px solid rgba(155,48,255,0.3)', borderLeftWidth: '3px', padding: '2.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f0eefc', marginBottom: '0.3rem' }}>
            Pronto pra centralizar tudo?{' '}
            <span style={{ background: 'rgba(57,255,20,0.15)', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14', fontSize: '0.7rem', padding: '0.18rem 0.65rem', borderRadius: '999px', fontWeight: 700, marginLeft: '0.4rem', verticalAlign: 'middle' }}>BETA</span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'rgba(240,238,252,0.45)' }}>Conecte suas plataformas em menos de 2 minutos e comece a crescer.</p>
        </div>
        <button onClick={() => setPage('waitlist')} style={{ background: '#39ff14', color: '#000', border: 'none', padding: '0.75rem 2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Criar conta grátis →
        </button>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(155,48,255,0.15)', marginTop: 'auto', padding: '3rem 2rem 2rem', background: 'rgba(6,7,11,0.98)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2.5rem', marginBottom: '2.5rem' }}>
            {/* Brand */}
            <div style={{ maxWidth: '220px' }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '0.6rem' }}>
                Sheik<span style={{ color: '#39ff14' }}>stream</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'rgba(240,238,252,0.32)', lineHeight: 1.7, margin: 0 }}>
                O hub definitivo para streamers brasileiros gerenciarem todas as suas plataformas.
              </p>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(240,238,252,0.28)', textTransform: 'uppercase', marginBottom: '0.85rem' }}>Produto</div>
                {['Recursos', 'Preços', 'Roadmap', 'Changelog'].map(l => (
                  <div key={l} style={{ fontSize: '0.82rem', color: 'rgba(240,238,252,0.45)', marginBottom: '0.5rem', cursor: 'pointer' }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(240,238,252,0.28)', textTransform: 'uppercase', marginBottom: '0.85rem' }}>Empresa</div>
                {['Sobre', 'Blog', 'Contato', 'Termos'].map(l => (
                  <div key={l} style={{ fontSize: '0.82rem', color: 'rgba(240,238,252,0.45)', marginBottom: '0.5rem', cursor: 'pointer' }}>{l}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(155,48,255,0.1)', marginBottom: '1.5rem' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(240,238,252,0.22)' }}>
              © 2025 Sheikstream. Feito com carinho para streamers brasileiros.
            </div>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {socialLinks.map(s => (
                <a
                  key={s.id}
                  href="#"
                  title={s.name}
                  style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}
                >
                  <PIcon id={s.id} color={s.color} size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
