import { useTranslation } from '../i18n'
import { SPACES } from '../data/spaces'
import { KIDS_SPACES } from '../data/spaces-kids'
import { GROUP_COLORS } from '../data/constants'
import type { GameState } from '../game/useGame'

interface Props {
  state: GameState
  onBuy: () => void
  onSkip: () => void
}

export function BuyPopup({ state, onBuy, onSkip }: Props) {
  const { t } = useTranslation()
  const spaces = state.mode === 'kids' ? KIDS_SPACES : SPACES
  const player = state.players[state.currentPlayer]
  const space = spaces[player.position]
  const color = space.group ? GROUP_COLORS[space.group] : '#999'

  return (
    <div className="popup-overlay">
      <div className="popup">
        <div className="popup-header" style={{ backgroundColor: color }}>
          {t(space.nameKey)}
        </div>
        <div className="popup-body">
          <p className="popup-title">{t('popup.unowned')}</p>
          <p className="popup-price">{t('popup.buyFor', { price: space.price ?? 0 })}</p>
          <p className="popup-balance">P{player.index + 1}: ${player.money}</p>
          <div className="popup-actions">
            <button className="btn btn-buy" onClick={onBuy}>{t('popup.buy')}</button>
            <button className="btn btn-skip" onClick={onSkip}>{t('popup.skip')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
