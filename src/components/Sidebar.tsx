import { LanguageSwitcher } from './LanguageSwitcher'
import { PlayerList } from './PlayerList'
import { GameLog } from './GameLog'
import { Controls } from './Controls'
import type { GameState } from '../game/useGame'

interface Props {
  state: GameState
  onRoll: () => void
  onPayBail: () => void
  onNewGame: () => void
}

export function Sidebar({ state, onRoll, onPayBail, onNewGame }: Props) {
  return (
    <div className="sidebar">
      <LanguageSwitcher />
      <Controls state={state} onRoll={onRoll} onPayBail={onPayBail} onNewGame={onNewGame} />
      <PlayerList players={state.players} currentPlayer={state.currentPlayer} mode={state.mode} />
      <GameLog log={state.log} />
    </div>
  )
}
