import { useTranslation } from '../i18n'
import { KIDS_BAIL_COST } from '../data/constants-kids'
import { BAIL_COST } from '../data/constants'
import type { GameState } from '../game/useGame'
import Dice from './Dice'

interface Props {
  state: GameState
  onRoll: () => void
  onPayBail: () => void
  onNewGame: () => void
}

export function Controls({ state, onRoll, onPayBail, onNewGame }: Props) {
  const { t } = useTranslation()
  const isKids = state.mode === 'kids'
  const player = state.players[state.currentPlayer]
  const canRoll = state.phase === 'rolling' && !state.players[state.currentPlayer]?.bankrupt
  const bailCost = isKids ? KIDS_BAIL_COST : BAIL_COST
  const showBail = player?.inJail && player.money >= bailCost

  return (
    <div className="controls">
      <Dice
        onRoll={onRoll}
        disabled={!canRoll}
        die1={state.dice[0]}
        die2={state.dice[1]}
        isDoubles={state.dice[0] === state.dice[1] && state.dice[0] > 0}
      />
      {state.canRollAgain && (
        <div className="roll-again-badge">🔥 {t('controls.rollAgain')}!</div>
      )}
      {showBail && (
        <button className="btn btn-bail" onClick={onPayBail}>
          {isKids ? t('controls.payBailKids') : t('controls.payBail')}
        </button>
      )}
      <button className="btn btn-new" onClick={onNewGame}>
        {t('controls.newGame')}
      </button>
    </div>
  )
}
