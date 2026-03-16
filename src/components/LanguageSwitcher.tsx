import { useTranslation, type Lang } from '../i18n'

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
]

export function LanguageSwitcher() {
  const { lang, setLang } = useTranslation()

  return (
    <div className="lang-switcher">
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          className={`lang-btn ${lang === l.code ? 'active' : ''}`}
          onClick={() => setLang(l.code)}
          title={l.label}
        >
          {l.flag} {l.label}
        </button>
      ))}
    </div>
  )
}
