import { useReducer, useCallback } from 'react'
import { SPACES, type Space } from '../data/spaces'
import { CHANCE_CARDS, CHEST_CARDS, type CardContext } from '../data/cards'
import { STARTING_MONEY, GO_SALARY, BAIL_COST, MAX_JAIL_TURNS, GROUP_SIZES } from '../data/constants'
import { KIDS_SPACES } from '../data/spaces-kids'
import { KIDS_CHANCE_CARDS, KIDS_CHEST_CARDS } from '../data/cards-kids'
import { KIDS_STARTING_MONEY, KIDS_GO_SALARY, KIDS_BAIL_COST, KIDS_MAX_JAIL_TURNS } from '../data/constants-kids'
import { KIDS_GROUP_SIZES } from '../data/spaces-kids'

export type GameMode = 'classic' | 'kids'

export interface Player {
  index: number
  money: number
  position: number
  properties: number[]
  inJail: boolean
  jailTurns: number
  bankrupt: boolean
  doublesCount: number
}

export interface LogEntry {
  key: string
  params?: Record<string, string | number>
}

export interface GameState {
  mode: GameMode
  players: Player[]
  currentPlayer: number
  ownership: (number | null)[]
  dice: [number, number]
  log: LogEntry[]
  phase: 'setup' | 'rolling' | 'buying' | 'done'
  winner: number | null
  lastRollWasDoubles: boolean
  canRollAgain: boolean
}

type Action =
  | { type: 'INIT'; playerCount: number; mode: GameMode }
  | { type: 'RESET' }
  | { type: 'ROLL_DICE' }
  | { type: 'BUY_PROPERTY' }
  | { type: 'SKIP_PROPERTY' }
  | { type: 'PAY_BAIL' }
  | { type: 'END_TURN' }

// --- Mode-aware helpers ---

function getSpaces(mode: GameMode): Space[] {
  return mode === 'kids' ? KIDS_SPACES : SPACES
}

function getChanceCards(mode: GameMode) {
  return mode === 'kids' ? KIDS_CHANCE_CARDS : CHANCE_CARDS
}

function getChestCards(mode: GameMode) {
  return mode === 'kids' ? KIDS_CHEST_CARDS : CHEST_CARDS
}

function getStartingMoney(mode: GameMode) {
  return mode === 'kids' ? KIDS_STARTING_MONEY : STARTING_MONEY
}

function getGoSalary(mode: GameMode) {
  return mode === 'kids' ? KIDS_GO_SALARY : GO_SALARY
}

function getBailCost(mode: GameMode) {
  return mode === 'kids' ? KIDS_BAIL_COST : BAIL_COST
}

function getMaxJailTurns(mode: GameMode) {
  return mode === 'kids' ? KIDS_MAX_JAIL_TURNS : MAX_JAIL_TURNS
}

function getGroupSizes(mode: GameMode) {
  return mode === 'kids' ? KIDS_GROUP_SIZES : GROUP_SIZES
}

function getBoardSize(mode: GameMode) {
  return mode === 'kids' ? KIDS_SPACES.length : SPACES.length
}

function getJailIndex(mode: GameMode) {
  const spaces = getSpaces(mode)
  return spaces.findIndex(s => s.type === 'jail')
}

// --- Core logic ---

function createPlayers(count: number, mode: GameMode): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    money: getStartingMoney(mode),
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0,
    bankrupt: false,
    doublesCount: 0,
  }))
}

function initialState(): GameState {
  return {
    mode: 'classic',
    players: [],
    currentPlayer: 0,
    ownership: [],
    dice: [1, 1],
    log: [],
    phase: 'setup',
    winner: null,
    lastRollWasDoubles: false,
    canRollAgain: false,
  }
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1
}

function addLog(state: GameState, key: string, params?: Record<string, string | number>): GameState {
  return { ...state, log: [{ key, params }, ...state.log].slice(0, 100) }
}

function countOwned(ownership: (number | null)[], playerIndex: number, group: string, mode: GameMode): number {
  const spaces = getSpaces(mode)
  return spaces.reduce((count, space, i) => {
    if (space.group === group && ownership[i] === playerIndex) return count + 1
    return count
  }, 0)
}

function calculateRent(spaceIndex: number, ownership: (number | null)[], dice: [number, number], mode: GameMode): number {
  const spaces = getSpaces(mode)
  const space = spaces[spaceIndex]
  const owner = ownership[spaceIndex]
  if (owner === null || space.rent === undefined) return 0

  if (space.type === 'railroad') {
    const count = countOwned(ownership, owner, 'railroad', mode)
    return 25 * Math.pow(2, count - 1)
  }

  if (space.type === 'utility') {
    const count = countOwned(ownership, owner, 'utility', mode)
    const diceTotal = dice[0] + dice[1]
    return count === 2 ? diceTotal * 10 : diceTotal * 4
  }

  const baseRent = space.rent ?? 0
  if (space.group) {
    const groupSizes = getGroupSizes(mode)
    const groupSize = groupSizes[space.group] ?? 0
    const owned = countOwned(ownership, owner, space.group, mode)
    if (owned === groupSize) return baseRent * 2
  }
  return baseRent
}

function checkBankruptcy(state: GameState): GameState {
  const activePlayers = state.players.filter(p => !p.bankrupt)
  if (activePlayers.length === 1) {
    return { ...state, phase: 'done', winner: activePlayers[0].index }
  }
  return state
}

function nextActivePlayer(state: GameState): number {
  let next = (state.currentPlayer + 1) % state.players.length
  while (state.players[next].bankrupt) {
    next = (next + 1) % state.players.length
  }
  return next
}

function processCardAction(state: GameState, isChance: boolean): GameState {
  const { mode } = state
  const cards = isChance ? getChanceCards(mode) : getChestCards(mode)
  const card = cards[Math.floor(Math.random() * cards.length)]
  const pIdx = state.currentPlayer
  const player = { ...state.players[pIdx] }
  const players = [...state.players]
  let newState = { ...state }
  let ownership = [...state.ownership]
  const boardSize = getBoardSize(mode)
  const jailIdx = getJailIndex(mode)

  const logKey = mode === 'kids'
    ? (isChance ? 'log.chanceKids' : 'log.chestKids')
    : (isChance ? 'log.chance' : 'log.chest')
  newState = addLog(newState, logKey, { name: `P${pIdx + 1}`, text: `{${card.textKey}}` })

  const ctx: CardContext = {
    playerIndex: pIdx,
    moveTo: (pos: number) => {
      if (pos === 0 && player.position !== 0) {
        player.money += getGoSalary(mode)
        newState = addLog(newState, mode === 'kids' ? 'log.passedGoKids' : 'log.passedGo', { name: `P${pIdx + 1}` })
      }
      player.position = pos
    },
    moveBy: (delta: number) => {
      player.position = ((player.position + delta) % boardSize + boardSize) % boardSize
    },
    addMoney: (amount: number) => {
      player.money += amount
    },
    goToJail: () => {
      player.position = jailIdx
      player.inJail = true
      player.jailTurns = 0
      newState = addLog(newState, mode === 'kids' ? 'log.goToNap' : 'log.goToJail', { name: `P${pIdx + 1}` })
    },
    collectFromAll: (amount: number) => {
      for (let i = 0; i < players.length; i++) {
        if (i !== pIdx && !players[i].bankrupt) {
          players[i] = { ...players[i], money: players[i].money - amount }
          player.money += amount
        }
      }
    },
    payToAll: (amount: number) => {
      for (let i = 0; i < players.length; i++) {
        if (i !== pIdx && !players[i].bankrupt) {
          players[i] = { ...players[i], money: players[i].money + amount }
          player.money -= amount
        }
      }
    },
  }

  card.action(ctx)
  players[pIdx] = player
  if (player.money < 0) {
    players[pIdx] = { ...players[pIdx], bankrupt: true }
    ownership = ownership.map(o => o === pIdx ? null : o)
    newState = addLog(newState, mode === 'kids' ? 'log.bankruptKids' : 'log.bankrupt', { name: `P${pIdx + 1}` })
  }

  return { ...newState, players, ownership }
}

function handleLanding(state: GameState): GameState {
  const { mode } = state
  const spaces = getSpaces(mode)
  const pIdx = state.currentPlayer
  const player = state.players[pIdx]
  const space = spaces[player.position]
  const players = [...state.players]
  let newState = { ...state }
  let ownership = [...state.ownership]
  const jailIdx = getJailIndex(mode)

  newState = addLog(newState, 'log.landed', { name: `P${pIdx + 1}`, space: `{${space.nameKey}}` })

  switch (space.type) {
    case 'property':
    case 'railroad':
    case 'utility': {
      const owner = ownership[player.position]
      if (owner === null) {
        if (space.price && player.money >= space.price) {
          return { ...newState, phase: 'buying' }
        }
      } else if (owner !== pIdx && !players[owner].bankrupt) {
        const rent = calculateRent(player.position, ownership, state.dice, mode)
        const p = { ...players[pIdx], money: players[pIdx].money - rent }
        const o = { ...players[owner], money: players[owner].money + rent }
        players[pIdx] = p
        players[owner] = o
        newState = addLog(newState, 'log.paidRent', {
          name: `P${pIdx + 1}`,
          amount: rent,
          owner: `P${owner + 1}`,
        })
        if (p.money < 0) {
          players[pIdx] = { ...p, bankrupt: true }
          ownership = ownership.map(ow => ow === pIdx ? null : ow)
          newState = addLog(newState, mode === 'kids' ? 'log.bankruptKids' : 'log.bankrupt', { name: `P${pIdx + 1}` })
        }
        newState = { ...newState, players, ownership }
      }
      break
    }
    case 'tax': {
      const taxAmt = space.taxAmount ?? 0
      const p = { ...players[pIdx], money: players[pIdx].money - taxAmt }
      players[pIdx] = p
      newState = addLog(newState, 'log.tax', { name: `P${pIdx + 1}`, amount: taxAmt })
      if (p.money < 0) {
        players[pIdx] = { ...p, bankrupt: true }
        ownership = ownership.map(o => o === pIdx ? null : o)
        newState = addLog(newState, mode === 'kids' ? 'log.bankruptKids' : 'log.bankrupt', { name: `P${pIdx + 1}` })
      }
      newState = { ...newState, players, ownership }
      break
    }
    case 'goToJail': {
      const p = { ...players[pIdx], position: jailIdx, inJail: true, jailTurns: 0 }
      players[pIdx] = p
      newState = addLog(newState, mode === 'kids' ? 'log.goToNap' : 'log.goToJail', { name: `P${pIdx + 1}` })
      newState = { ...newState, players }
      break
    }
    case 'chance': {
      newState = processCardAction(newState, true)
      break
    }
    case 'chest': {
      newState = processCardAction(newState, false)
      break
    }
    case 'freeParking': {
      newState = addLog(newState, 'log.freeParking', { name: `P${pIdx + 1}` })
      break
    }
    case 'jail': {
      newState = addLog(newState, mode === 'kids' ? 'log.visitingKids' : 'log.visiting', { name: `P${pIdx + 1}` })
      break
    }
    default:
      break
  }

  return checkBankruptcy(newState)
}

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'INIT': {
      const boardSize = getBoardSize(action.mode)
      return {
        ...initialState(),
        mode: action.mode,
        players: createPlayers(action.playerCount, action.mode),
        ownership: new Array(boardSize).fill(null),
        phase: 'rolling',
      }
    }

    case 'RESET':
      return initialState()

    case 'ROLL_DICE': {
      const { mode } = state
      const boardSize = getBoardSize(mode)
      const goSalary = getGoSalary(mode)
      const bailCost = getBailCost(mode)
      const maxJailTurns = getMaxJailTurns(mode)
      const jailIdx = getJailIndex(mode)

      const d1 = rollDie()
      const d2 = rollDie()
      const isDoubles = d1 === d2
      const pIdx = state.currentPlayer
      const players = [...state.players]
      let player = { ...players[pIdx] }
      let newState: GameState = { ...state, dice: [d1, d2] }

      // Handle jail / nap
      if (player.inJail) {
        newState = addLog(newState, 'log.rolled', {
          name: `P${pIdx + 1}`, d1, d2, total: d1 + d2,
        })
        if (isDoubles) {
          player = { ...player, inJail: false, jailTurns: 0, doublesCount: 0 }
          newState = addLog(newState, mode === 'kids' ? 'log.napFree' : 'log.jailFree', { name: `P${pIdx + 1}` })
        } else {
          player = { ...player, jailTurns: player.jailTurns + 1 }
          if (player.jailTurns >= maxJailTurns) {
            player = { ...player, money: player.money - bailCost, inJail: false, jailTurns: 0 }
            newState = addLog(newState, mode === 'kids' ? 'log.paidNapBail' : 'log.paidBail', { name: `P${pIdx + 1}` })
          } else {
            newState = addLog(newState, mode === 'kids' ? 'log.napRollFail' : 'log.jailRollFail', { name: `P${pIdx + 1}` })
            players[pIdx] = player
            const next = nextActivePlayer({ ...newState, players })
            return { ...newState, players, currentPlayer: next, canRollAgain: false }
          }
        }
        if (!player.inJail) {
          const newPos = (player.position + d1 + d2) % boardSize
          if (newPos < player.position) {
            player = { ...player, money: player.money + goSalary }
            newState = addLog(newState, mode === 'kids' ? 'log.passedGoKids' : 'log.passedGo', { name: `P${pIdx + 1}` })
          }
          player = { ...player, position: newPos }
          players[pIdx] = player
          newState = { ...newState, players }
          return handleLanding(newState)
        }
        players[pIdx] = player
        const next = nextActivePlayer({ ...newState, players })
        return { ...newState, players, currentPlayer: next }
      }

      // Normal roll
      player = { ...player, doublesCount: isDoubles ? player.doublesCount + 1 : 0 }

      newState = addLog(newState, 'log.rolled', {
        name: `P${pIdx + 1}`, d1, d2, total: d1 + d2,
      })

      // Triple doubles → jail (not in kids mode)
      if (mode !== 'kids' && player.doublesCount >= 3) {
        newState = addLog(newState, 'log.triplDoubles', { name: `P${pIdx + 1}` })
        player = { ...player, position: jailIdx, inJail: true, jailTurns: 0, doublesCount: 0 }
        newState = addLog(newState, 'log.goToJail', { name: `P${pIdx + 1}` })
        players[pIdx] = player
        const next = nextActivePlayer({ ...newState, players })
        return { ...newState, players, currentPlayer: next, canRollAgain: false }
      }

      // Move
      const newPos = (player.position + d1 + d2) % boardSize
      if (newPos < player.position) {
        player = { ...player, money: player.money + goSalary }
        newState = addLog(newState, mode === 'kids' ? 'log.passedGoKids' : 'log.passedGo', { name: `P${pIdx + 1}` })
      }
      player = { ...player, position: newPos }
      players[pIdx] = player
      newState = { ...newState, players, lastRollWasDoubles: isDoubles, canRollAgain: isDoubles }

      const landed = handleLanding(newState)

      if (landed.phase === 'buying' || landed.phase === 'done') {
        return landed
      }

      if (isDoubles && !landed.players[pIdx].inJail && !landed.players[pIdx].bankrupt) {
        return { ...landed, canRollAgain: true }
      }

      const next = nextActivePlayer(landed)
      return { ...landed, currentPlayer: next, canRollAgain: false }
    }

    case 'BUY_PROPERTY': {
      const { mode } = state
      const spaces = getSpaces(mode)
      const pIdx = state.currentPlayer
      const players = [...state.players]
      const player = { ...players[pIdx] }
      const space = spaces[player.position]
      const price = space.price ?? 0

      player.money -= price
      player.properties = [...player.properties, player.position]
      players[pIdx] = player

      const ownership = [...state.ownership]
      ownership[player.position] = pIdx

      let newState = addLog(
        { ...state, players, ownership, phase: 'rolling' },
        'log.bought',
        { name: `P${pIdx + 1}`, space: `{${space.nameKey}}`, price }
      )

      if (state.canRollAgain && !player.inJail) {
        return { ...newState, canRollAgain: true }
      }

      const next = nextActivePlayer(newState)
      return { ...newState, currentPlayer: next, canRollAgain: false }
    }

    case 'SKIP_PROPERTY': {
      let newState = { ...state, phase: 'rolling' as const }

      if (state.canRollAgain && !state.players[state.currentPlayer].inJail) {
        return { ...newState, canRollAgain: true }
      }

      const next = nextActivePlayer(newState)
      return { ...newState, currentPlayer: next, canRollAgain: false }
    }

    case 'PAY_BAIL': {
      const { mode } = state
      const bailCost = getBailCost(mode)
      const pIdx = state.currentPlayer
      const players = [...state.players]
      const player = { ...players[pIdx], money: players[pIdx].money - bailCost, inJail: false, jailTurns: 0 }
      players[pIdx] = player

      let newState = addLog({ ...state, players }, mode === 'kids' ? 'log.paidNapBail' : 'log.paidBail', { name: `P${pIdx + 1}` })

      if (player.money < 0) {
        const ownership = state.ownership.map(o => o === pIdx ? null : o)
        players[pIdx] = { ...player, bankrupt: true }
        newState = addLog({ ...newState, players, ownership }, mode === 'kids' ? 'log.bankruptKids' : 'log.bankrupt', { name: `P${pIdx + 1}` })
        return checkBankruptcy(newState)
      }

      return newState
    }

    case 'END_TURN': {
      const next = nextActivePlayer(state)
      return { ...state, currentPlayer: next, canRollAgain: false }
    }

    default:
      return state
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState())

  const initGame = useCallback((playerCount: number, mode: GameMode = 'classic') => {
    dispatch({ type: 'INIT', playerCount, mode })
  }, [])

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const rollDice = useCallback(() => {
    dispatch({ type: 'ROLL_DICE' })
  }, [])

  const buyProperty = useCallback(() => {
    dispatch({ type: 'BUY_PROPERTY' })
  }, [])

  const skipProperty = useCallback(() => {
    dispatch({ type: 'SKIP_PROPERTY' })
  }, [])

  const payBail = useCallback(() => {
    dispatch({ type: 'PAY_BAIL' })
  }, [])

  const endTurn = useCallback(() => {
    dispatch({ type: 'END_TURN' })
  }, [])

  return {
    state,
    initGame,
    resetGame,
    rollDice,
    buyProperty,
    skipProperty,
    payBail,
    endTurn,
  }
}
