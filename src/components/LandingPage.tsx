import { useTranslation } from '../i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Board } from './Board'
import { SPACES } from '../data/spaces'
import type { GameMode } from '../game/useGame'

interface Props {
  onStart: (mode: GameMode) => void
}

const FEATURES = [
  { icon: '👥', titleKey: 'landing.feature.multiplayer.title', descKey: 'landing.feature.multiplayer.desc' },
  { icon: '🎩', titleKey: 'landing.feature.classic.title', descKey: 'landing.feature.classic.desc' },
  { icon: '🧸', titleKey: 'landing.feature.kids.title', descKey: 'landing.feature.kids.desc' },
  { icon: '⚡', titleKey: 'landing.feature.local.title', descKey: 'landing.feature.local.desc' },
] as const

export function LandingPage({ onStart }: Props) {
  const { t } = useTranslation()
  const emptyOwnership: (number | null)[] = new Array(SPACES.length).fill(null)

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">
          <span className="landing-logo-icon">🎩</span>
          <span className="landing-logo-text">{t('setup.title')}</span>
        </div>
        <LanguageSwitcher />
      </header>

      <section className="landing-hero">
        <div className="landing-board-preview" aria-hidden="true">
          <Board mode="classic" players={[]} ownership={emptyOwnership} onSpaceClick={() => {}} />
          <div className="landing-board-glow" />
          <div className="landing-board-dice">
            <div className="landing-die">⚂</div>
            <div className="landing-die">⚄</div>
          </div>
        </div>

        <div className="landing-hero-content">
          <h1 className="landing-headline">{t('landing.tagline')}</h1>
          <p className="landing-subtitle">{t('landing.subtitle')}</p>
          <div className="landing-cta">
            <button className="btn landing-cta-primary" onClick={() => onStart('classic')}>
              🎲 {t('landing.startClassic')}
            </button>
            <button className="btn landing-cta-kids" onClick={() => onStart('kids')}>
              🧸 {t('landing.startKids')}
            </button>
          </div>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map(f => (
          <div key={f.titleKey} className="landing-feature">
            <div className="landing-feature-icon">{f.icon}</div>
            <div className="landing-feature-title">{t(f.titleKey)}</div>
            <div className="landing-feature-desc">{t(f.descKey)}</div>
          </div>
        ))}
      </section>
    </div>
  )
}
