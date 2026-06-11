'use client'
import { useLang } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n/translations'

const FLAGS: Record<Lang, string> = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' }
const LABELS: Record<Lang, string> = { pt: 'PT', en: 'EN', es: 'ES' }

export function LanguageSwitcher({ color = 'rgba(232,230,248,0.45)', hoverBg = 'rgba(155,48,255,0.12)', activeBg = 'rgba(155,48,255,0.2)', activeColor = '#c084fc' }: {
  color?: string; hoverBg?: string; activeBg?: string; activeColor?: string
}) {
  const { lang, setLang } = useLang()

  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {(['pt', 'en', 'es'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          title={l === 'pt' ? 'Português' : l === 'en' ? 'English' : 'Español'}
          style={{
            background: lang === l ? activeBg : 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 6,
            padding: '0.2rem 0.4rem',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: lang === l ? activeColor : color,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            letterSpacing: '0.03em',
            transition: 'background 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { if (lang !== l) (e.currentTarget as HTMLButtonElement).style.background = hoverBg }}
          onMouseLeave={e => { if (lang !== l) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <span style={{ fontSize: '0.85rem' }}>{FLAGS[l]}</span>
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
