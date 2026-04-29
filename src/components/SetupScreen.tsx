import { useState } from 'react'
import { useTranslation } from '../i18n'
import { PLAYER_COLORS } from '../data/constants'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { GameMode } from '../game/useGame'

interface Props {
  onStart: (count: number, mode: GameMode) => void
  mode: GameMode
  onBack?: () => void
}

export function SetupScreen({ onStart, mode, onBack }: Props) {
  const [count, setCount] = useState(4)
  const { t } = useTranslation()

  return (
    <div className={`setup-overlay ${mode === 'kids' ? 'kids-setup' : ''}`}>
      <div className="setup-box">
        {onBack && (
          <button className="setup-back" onClick={onBack}>
            {t('landing.back')}
          </button>
        )}
        <LanguageSwitcher />
        <h1 className="setup-title">
          {mode === 'kids' ? '🎈 ' : ''}{t('setup.title')}{mode === 'kids' ? ' 🎈' : ''}
        </h1>
        <p className="setup-subtitle">{t('setup.subtitle')}</p>

        <div className="player-count-buttons">
          {[2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              className={`count-btn ${n === count ? 'active' : ''}`}
              onClick={() => setCount(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="player-preview">
          <span className="preview-label">{t('setup.players')}</span>
          <div className="preview-chips">
            {Array.from({ length: count }, (_, i) => (
              <div
                key={i}
                className="preview-chip"
                style={{ backgroundColor: PLAYER_COLORS[i] }}
              />
            ))}
          </div>
        </div>

        <button className="start-btn" onClick={() => onStart(count, mode)}>
          {t('setup.start')} {mode === 'kids' ? '🚀' : ''}
        </button>
      </div>
    </div>
  )
}
