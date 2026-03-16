import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { en } from './en'
import { ru } from './ru'

export type Lang = 'en' | 'ru'

const translations: Record<Lang, Record<string, string>> = { en, ru }

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType>(null!)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let str = translations[lang][key] ?? translations['en'][key] ?? key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation() {
  return useContext(I18nContext)
}
