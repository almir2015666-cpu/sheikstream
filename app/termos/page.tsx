'use client'
import { useState } from 'react'

const C = {
  bg: '#08090d', card: '#111219', border: 'rgba(255,255,255,0.07)',
  borderP: 'rgba(155,48,255,0.2)', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.35)',
  vdim: 'rgba(232,230,248,0.18)', primary: '#9b30ff',
}

export default function TermosPage() {
  const [termsChecked, setTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleAccept() {
    if (!termsChecked || !privacyChecked || saving) return
    setSaving(true)
    // Store acceptance flags in a short-lived cookie, then start Twitch OAuth
    const flags = ['terms', privacyChecked ? 'privacy' : '', marketingChecked ? 'marketing' : '']
      .filter(Boolean).join(',')
    document.cookie = `sk-tpending=${encodeURIComponent(flags)}; path=/; max-age=600; SameSite=Lax`
    window.location.href = '/api/auth/twitch'
  }

  function handleDecline() {
    window.location.href = '/login'
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: C.card, border: `1px solid ${C.borderP}`, borderRadius: '20px', padding: '2.5rem 2rem', maxWidth: '480px', width: '100%', boxShadow: '0 0 60px rgba(155,48,255,0.12), 0 24px 48px rgba(0,0,0,0.7)' }}>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'linear-gradient(135deg,#9b30ff,#6b1fc2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: C.text, marginBottom: '0.4rem' }}>Antes de continuar</div>
          <div style={{ fontSize: '0.84rem', color: C.muted, lineHeight: 1.5 }}>
            Para criar sua conta e entrar com a Twitch, aceite os termos abaixo.
          </div>
        </div>

        {/* Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { key: 'terms',     checked: termsChecked,     set: setTermsChecked,     required: true,  label: 'Li e concordo com os', link: '/terms',      linkText: 'Termos de Uso',           after: 'da SheikSTREAM' },
            { key: 'privacy',   checked: privacyChecked,   set: setPrivacyChecked,   required: true,  label: 'Li e concordo com a',  link: '/privacidade', linkText: 'Política de Privacidade', after: 'da SheikSTREAM' },
            { key: 'marketing', checked: marketingChecked, set: setMarketingChecked, required: false, label: 'Aceito receber novidades, dicas e promoções da SheikSTREAM', link: null, linkText: null, after: null },
          ].map(item => (
            <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={e => item.set(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 3, accentColor: '#9b30ff', flexShrink: 0, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.84rem', color: C.muted, lineHeight: 1.55 }}>
                {item.label}{' '}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: C.primary, fontWeight: 600, textDecoration: 'underline' }}>
                    {item.linkText}
                  </a>
                )}
                {item.after && ` ${item.after}`}
                {item.required && <span style={{ color: '#ef4444', marginLeft: '0.2rem' }}>*</span>}
              </span>
            </label>
          ))}
        </div>

        <div style={{ fontSize: '0.72rem', color: C.vdim, marginBottom: '1.25rem' }}>* campos obrigatórios</div>

        {/* Aceitar → Twitch OAuth */}
        <button
          disabled={!termsChecked || !privacyChecked || saving}
          onClick={handleAccept}
          style={{
            width: '100%', padding: '0.85rem', border: 'none', borderRadius: '12px',
            background: termsChecked && privacyChecked ? 'linear-gradient(135deg,#9b30ff,#6b1fc2)' : 'rgba(255,255,255,0.05)',
            color: termsChecked && privacyChecked ? '#fff' : C.vdim,
            fontWeight: 800, fontSize: '0.95rem',
            cursor: termsChecked && privacyChecked && !saving ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s', marginBottom: '0.65rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
          }}
        >
          {saving ? (
            'Redirecionando...'
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.9">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              Aceitar e entrar com Twitch
            </>
          )}
        </button>

        {/* Recusar */}
        <button
          onClick={handleDecline}
          style={{
            width: '100%', padding: '0.7rem', border: `1px solid ${C.border}`, borderRadius: '12px',
            background: 'transparent', color: C.dim, fontWeight: 600, fontSize: '0.85rem',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          Não aceitar — voltar ao início
        </button>

        <div style={{ marginTop: '1.1rem', fontSize: '0.73rem', color: C.vdim, textAlign: 'center', lineHeight: 1.5 }}>
          Após aceitar, você será redirecionado para autenticar com sua conta Twitch.
        </div>
      </div>
    </div>
  )
}
