import { useGame } from './game/useGame'
import { SetupScreen } from './components/SetupScreen'
import { Board } from './components/Board'
import { Sidebar } from './components/Sidebar'
import { BuyPopup } from './components/BuyPopup'
import { PropertyPopup } from './components/PropertyPopup'
import { WinnerOverlay } from './components/WinnerOverlay'
import { useState } from 'react'

export default function App() {
  const { state, initGame, resetGame, rollDice, buyProperty, skipProperty, payBail } = useGame()
  const [inspectSpace, setInspectSpace] = useState<number | null>(null)

  if (state.phase === 'setup') {
    return <SetupScreen onStart={initGame} />
  }

  return (
    <div className={`game-container ${state.mode === 'kids' ? 'kids-mode' : ''}`}>
      <Board
        players={state.players}
        ownership={state.ownership}
        mode={state.mode}
        onSpaceClick={setInspectSpace}
      />
      <Sidebar
        state={state}
        onRoll={rollDice}
        onPayBail={payBail}
        onNewGame={resetGame}
      />
      {state.phase === 'buying' && (
        <BuyPopup
          state={state}
          onBuy={buyProperty}
          onSkip={skipProperty}
        />
      )}
      {inspectSpace !== null && (
        <PropertyPopup
          spaceIndex={inspectSpace}
          ownership={state.ownership}
          players={state.players}
          mode={state.mode}
          onClose={() => setInspectSpace(null)}
        />
      )}
      {state.phase === 'done' && state.winner !== null && (
        <WinnerOverlay
          winnerIndex={state.winner}
          money={state.players[state.winner].money}
          mode={state.mode}
          onPlayAgain={resetGame}
        />
      )}
    </div>
  )
}
