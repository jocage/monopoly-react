import { useTranslation } from '../i18n'
import { PLAYER_COLORS } from '../data/constants'
import type { GameMode } from '../game/useGame'

interface Props {
  mode: GameMode
  winnerIndex: number
  money: number
  onPlayAgain: () => void
}

export function WinnerOverlay({ mode, winnerIndex, money, onPlayAgain }: Props) {
  const { t } = useTranslation()
  const isKids = mode === 'kids'

  return (
    <div className={`popup-overlay winner-overlay ${isKids ? 'winner-kids' : ''}`}>
      <div className="winner-box">
        <h1>{isKids ? t('winner.titleKids') : t('winner.title')}</h1>
        <div
          className="winner-chip"
          style={{ backgroundColor: PLAYER_COLORS[winnerIndex] }}
        />
        <p className="winner-name">
          {isKids
            ? t('winner.winsKids', { name: `P${winnerIndex + 1}` })
            : t('winner.wins', { name: `P${winnerIndex + 1}` })}
        </p>
        <p className="winner-money">{t('winner.finalMoney', { money })}</p>
        <button className="btn btn-play-again" onClick={onPlayAgain}>
          {t('winner.playAgain')} {isKids ? '🎈' : ''}
        </button>
      </div>
    </div>
  )
}
