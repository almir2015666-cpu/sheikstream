'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { translations, type Lang, type TKey } from './translations'

const STORAGE_KEY = 'sk-lang'

interface LangCtx { lang: Lang; setLang: (l: Lang) => void; t: (key: TKey) => string }
const Ctx = createContext<LangCtx>({ lang: 'pt', setLang: () => {}, t: k => k })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('pt')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
      if (saved && saved in translations) setLangState(saved)
    } catch { /* ignore */ }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* ignore */ }
    // Update html lang attribute
    try { document.documentElement.lang = l === 'pt' ? 'pt-BR' : l === 'en' ? 'en' : 'es' } catch { /* ignore */ }
  }

  const t = (key: TKey): string => translations[lang][key] ?? translations['pt'][key] ?? key

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useLang() { return useContext(Ctx) }
