import { useCallback, useEffect, useState } from 'react'
import { useGame, type GameMode } from './game/useGame'
import { useMultiplayerGame } from './game/multiplayer'
import { LandingPage } from './components/LandingPage'
import { SetupScreen } from './components/SetupScreen'
import { Board } from './components/Board'
import { Sidebar } from './components/Sidebar'
import { BuyPopup } from './components/BuyPopup'
import { PropertyPopup } from './components/PropertyPopup'
import { WinnerOverlay } from './components/WinnerOverlay'
import { Lobby } from './components/Lobby'

type Route =
  | { name: 'landing' }
  | { name: 'setup'; mode: GameMode }
  | { name: 'lobby'; initialCode?: string }
  | { name: 'local-game' }
  | { name: 'mp-game' }

function readRoute(): Route {
  const path = window.location.pathname
  if (path === '/' || path === '') return { name: 'landing' }
  if (path === '/setup/classic') return { name: 'setup', mode: 'classic' }
  if (path === '/setup/kids') return { name: 'setup', mode: 'kids' }
  if (path === '/game') return { name: 'local-game' }
  const roomMatch = path.match(/^\/room\/([A-Z0-9]+)?$/i)
  if (roomMatch) {
    return { name: 'lobby', initialCode: roomMatch[1]?.toUpperCase() }
  }
  return { name: 'landing' }
}

function navigate(route: Route): void {
  let path = '/'
  if (route.name === 'setup') path = `/setup/${route.mode}`
  else if (route.name === 'local-game') path = '/game'
  else if (route.name === 'lobby') path = `/room/${route.initialCode ?? ''}`
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path)
  }
}

export default function App() {
  const local = useGame()
  const mp = useMultiplayerGame()
  const [route, setRoute] = useState<Route>(() => readRoute())
  const [inspectSpace, setInspectSpace] = useState<number | null>(null)

  // Sync URL with browser back/forward.
  useEffect(() => {
    const onPop = () => setRoute(readRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // When the multiplayer game starts, navigate to the game view.
  useEffect(() => {
    if (mp.phase === 'playing' || mp.phase === 'ended') {
      if (route.name !== 'mp-game') {
        navigate({ name: 'mp-game' })
        setRoute({ name: 'mp-game' })
      }
    }
  }, [mp.phase, route.name])

  // Drop token if user manually navigates away from /room.
  useEffect(() => {
    if (route.name !== 'lobby' && route.name !== 'mp-game' && mp.room) {
      mp.leaveRoom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.name])

  const goToLanding = useCallback(() => {
    navigate({ name: 'landing' })
    setRoute({ name: 'landing' })
    local.resetGame()
  }, [local])

  const goToSetup = useCallback((mode: GameMode) => {
    navigate({ name: 'setup', mode })
    setRoute({ name: 'setup', mode })
  }, [])

  const goToLobby = useCallback((initialCode?: string) => {
    navigate({ name: 'lobby', initialCode })
    setRoute({ name: 'lobby', initialCode })
  }, [])

  const startLocalGame = useCallback((count: number, mode: GameMode) => {
    local.initGame(count, mode)
    navigate({ name: 'local-game' })
    setRoute({ name: 'local-game' })
  }, [local])

  // --- Render by route ---

  if (route.name === 'landing') {
    return (
      <LandingPage
        onStart={goToSetup}
        onMultiplayer={code => goToLobby(code)}
      />
    )
  }

  if (route.name === 'setup') {
    return (
      <SetupScreen
        mode={route.mode}
        onStart={startLocalGame}
        onBack={goToLanding}
      />
    )
  }

  if (route.name === 'lobby') {
    return (
      <Lobby
        mp={mp}
        onLeave={() => { mp.leaveRoom(); goToLanding() }}
        initialCode={route.initialCode}
      />
    )
  }

  if (route.name === 'mp-game') {
    return renderGameView({
      state: mp.state,
      canRoll: mp.isMyTurn,
      waitingReason: !mp.isMyTurn
        ? `Waiting for P${mp.state.currentPlayer + 1}…`
        : (!mp.connected ? 'Reconnecting…' : null),
      onRoll: () => mp.sendAction('ROLL_DICE'),
      onBuy: () => mp.sendAction('BUY_PROPERTY'),
      onSkip: () => mp.sendAction('SKIP_PROPERTY'),
      onPayBail: () => mp.sendAction('PAY_BAIL'),
      onNewGame: () => { mp.leaveRoom(); goToLanding() },
      inspectSpace,
      setInspectSpace,
    })
  }

  // local-game
  return renderGameView({
    state: local.state,
    canRoll: true,
    waitingReason: null,
    onRoll: local.rollDice,
    onBuy: local.buyProperty,
    onSkip: local.skipProperty,
    onPayBail: local.payBail,
    onNewGame: goToLanding,
    inspectSpace,
    setInspectSpace,
  })
}

interface GameViewProps {
  state: ReturnType<typeof useGame>['state']
  canRoll: boolean
  waitingReason: string | null
  onRoll: () => void
  onBuy: () => void
  onSkip: () => void
  onPayBail: () => void
  onNewGame: () => void
  inspectSpace: number | null
  setInspectSpace: (n: number | null) => void
}

function renderGameView(p: GameViewProps) {
  return (
    <div className={`game-container ${p.state.mode === 'kids' ? 'kids-mode' : ''}`}>
      <Board
        players={p.state.players}
        ownership={p.state.ownership}
        mode={p.state.mode}
        onSpaceClick={p.setInspectSpace}
      />
      <Sidebar
        state={p.state}
        onRoll={p.onRoll}
        onPayBail={p.onPayBail}
        onNewGame={p.onNewGame}
        forceDisabled={!p.canRoll}
        disabledReason={p.waitingReason ?? undefined}
      />
      {p.state.phase === 'buying' && (
        <BuyPopup
          state={p.state}
          onBuy={p.onBuy}
          onSkip={p.onSkip}
        />
      )}
      {p.inspectSpace !== null && (
        <PropertyPopup
          spaceIndex={p.inspectSpace}
          ownership={p.state.ownership}
          players={p.state.players}
          mode={p.state.mode}
          onClose={() => p.setInspectSpace(null)}
        />
      )}
      {p.state.phase === 'done' && p.state.winner !== null && (
        <WinnerOverlay
          winnerIndex={p.state.winner}
          money={p.state.players[p.state.winner].money}
          mode={p.state.mode}
          onPlayAgain={p.onNewGame}
        />
      )}
    </div>
  )
}
