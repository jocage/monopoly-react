// Wire-format types and converters between the backend's snake_case JSON and
// the local GameState used by the React components.

import type { GameState, GameMode } from '../game/useGame'

export type WirePhase = 'setup' | 'rolling' | 'buying' | 'done'

export interface WirePlayer {
  index: number
  money: number
  position: number
  properties: number[]
  in_jail: boolean
  jail_turns: number
  bankrupt: boolean
  doubles_count: number
}

export interface WireLogEntry {
  key: string
  params: Record<string, string | number> | null
}

export interface WireGameState {
  mode: GameMode
  current_player: number
  ownership: (number | null)[]
  dice: [number, number]
  log: WireLogEntry[]
  phase: WirePhase
  winner: number | null
  last_roll_was_doubles: boolean
  can_roll_again: boolean
  players: WirePlayer[]
}

export interface WireRoom {
  code: string
  mode: GameMode
  max_players: number
  started: boolean
  player_count: number
  player_tokens: Record<string, string>
}

export interface WireStateMessage {
  type: 'state'
  room: WireRoom
  state: WireGameState
}

export interface WireCreatedMessage {
  type: 'created'
  request_id?: string
  code: string
  mode: GameMode
}

export interface WireJoinedMessage {
  type: 'joined'
  request_id?: string
  code: string
  player_index: number
  token: string
}

export interface WireSpectatingMessage {
  type: 'spectating'
  request_id?: string
  code: string
}

export interface WireStartedMessage {
  type: 'started'
  request_id?: string
}

export interface WireErrorMessage {
  type: 'error'
  message: string
  request_id?: string
}

export type WireServerMessage =
  | WireStateMessage
  | WireCreatedMessage
  | WireJoinedMessage
  | WireSpectatingMessage
  | WireStartedMessage
  | WireErrorMessage

// --- Client-to-server messages ---

export type WireActionKind =
  | 'ROLL_DICE'
  | 'BUY_PROPERTY'
  | 'SKIP_PROPERTY'
  | 'PAY_BAIL'
  | 'END_TURN'
  | 'RESET'

export type WireClientMessage =
  | { type: 'create'; mode: GameMode; seed?: number; request_id?: string }
  | { type: 'join'; code: string; player_index?: number; request_id?: string }
  | { type: 'spectate'; code: string; request_id?: string }
  | { type: 'start'; request_id?: string }
  | { type: 'action'; action: WireActionKind; player_index: number; token: string; request_id?: string }

export function wireToLocalState(w: WireGameState): GameState {
  return {
    mode: w.mode,
    currentPlayer: w.current_player,
    ownership: w.ownership,
    dice: w.dice,
    log: w.log.map(e => ({ key: e.key, params: e.params ?? undefined })),
    phase: w.phase,
    winner: w.winner,
    lastRollWasDoubles: w.last_roll_was_doubles,
    canRollAgain: w.can_roll_again,
    players: w.players.map(p => ({
      index: p.index,
      money: p.money,
      position: p.position,
      properties: p.properties,
      inJail: p.in_jail,
      jailTurns: p.jail_turns,
      bankrupt: p.bankrupt,
      doublesCount: p.doubles_count,
    })),
  }
}

// A local "empty" state used by the Lobby before any state snapshot arrives.
export function emptyLocalState(mode: GameMode): GameState {
  return {
    mode,
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
