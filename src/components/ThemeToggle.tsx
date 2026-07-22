import { useTranslation } from '../i18n'
import { useTheme } from '../theme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'

  return (
    <div className="theme-toggle-row">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title={t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')}
        aria-label={t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')}
      >
        <span className="theme-toggle-icon" aria-hidden="true">
          {isDark ? '☀️' : '🌙'}
        </span>
        <span>{t(isDark ? 'theme.light' : 'theme.dark')}</span>
      </button>
    </div>
  )
}