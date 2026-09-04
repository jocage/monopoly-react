import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { PlayerList } from './PlayerList'
import { GameLog } from './GameLog'
import { Controls } from './Controls'
import type { GameState } from '../game/useGame'

interface Props {
  state: GameState
  onRoll: () => void
  onPayBail: () => void
  onNewGame: () => void
  forceDisabled?: boolean
  disabledReason?: string
}

export function Sidebar({ state, onRoll, onPayBail, onNewGame, forceDisabled, disabledReason }: Props) {
  return (
    <div className="sidebar">
      <LanguageSwitcher />
      <ThemeToggle />
      <Controls
        state={state}
        onRoll={onRoll}
        onPayBail={onPayBail}
        onNewGame={onNewGame}
        forceDisabled={forceDisabled}
        disabledReason={disabledReason}
      />
      <PlayerList players={state.players} currentPlayer={state.currentPlayer} mode={state.mode} />
      <GameLog log={state.log} />
    </div>
  )
}
