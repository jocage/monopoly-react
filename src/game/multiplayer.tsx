// React hook that wraps the WebSocket client and exposes a state shape
// matching useGame() so existing board components work unchanged.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  clearStoredToken,
  loadStoredTokens,
  saveStoredToken,
  WsClient,
} from '../net/wsClient'
import {
  emptyLocalState,
  wireToLocalState,
} from '../net/types'
import type { GameMode, GameState } from './useGame'
import type { WireActionKind, WireServerMessage } from '../net/types'

export type MultiplayerPhase =
  | 'idle'
  | 'connecting'
  | 'lobby'
  | 'playing'
  | 'ended'
  | 'error'

export interface MultiplayerSlot {
  index: number
  taken: boolean
  takenByMe: boolean
}

export interface MultiplayerState {
  phase: MultiplayerPhase
  connected: boolean
  room: { code: string; mode: GameMode; started: boolean; maxPlayers: number } | null
  slots: MultiplayerSlot[]
  state: GameState
  myIndex: number | null
  myToken: string | null
  error: string | null
  isMyTurn: boolean
}

export interface MultiplayerActions {
  createRoom: (mode: GameMode) => Promise<void>
  joinRoom: (code: string, slot?: number) => Promise<void>
  spectateRoom: (code: string) => Promise<void>
  startGame: () => Promise<void>
  sendAction: (action: WireActionKind) => void
  leaveRoom: () => void
}

const MAX_SLOTS = 6

export function useMultiplayerGame(): MultiplayerState & MultiplayerActions {
  const clientRef = useRef<WsClient | null>(null)
  const codeRef = useRef<string | null>(null)
  const myIndexRef = useRef<number | null>(null)
  const myTokenRef = useRef<string | null>(null)
  const startedRef = useRef<boolean>(false)
  const reconnectRef = useRef<boolean>(false)
  const phaseRef = useRef<MultiplayerPhase>('idle')

  const [phase, setPhase] = useState<MultiplayerPhase>('idle')
  const [connected, setConnected] = useState(false)
  const [room, setRoom] = useState<MultiplayerState['room']>(null)
  const [slots, setSlots] = useState<MultiplayerSlot[]>([])
  const [state, setState] = useState<GameState>(() => emptyLocalState('classic'))
  const [myIndex, setMyIndex] = useState<number | null>(null)
  const [myToken, setMyToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Lazily create the client on first use; reuse across effect cycles.
  if (clientRef.current === null) {
    clientRef.current = new WsClient()
  }
  const client = clientRef.current

  const setPhaseTracked = useCallback((p: MultiplayerPhase) => {
    phaseRef.current = p
    setPhase(p)
  }, [])

  useEffect(() => {
    const offMsg = client.on((msg: WireServerMessage) => {
      handleServerMessage(msg)
    })
    const offErr = client.onError(err => {
      setError(err)
    })
    const offConn = client.onConnection(c => {
      setConnected(c)
      if (c && reconnectRef.current && codeRef.current) {
        // Reconnected — try to silently rejoin if we have a token.
        const stored = loadStoredTokens()[codeRef.current]
        if (stored) {
          client.send({
            type: 'join',
            code: codeRef.current,
            player_index: stored.playerIndex,
            request_id: `rejoin-${Date.now()}`,
          })
        }
      }
      reconnectRef.current = false
    })

    client.connect()

    return () => {
      offMsg()
      offErr()
      offConn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleServerMessage(msg: WireServerMessage): void {
    if (msg.type === 'state') {
      const localState = wireToLocalState(msg.state)
      setState(localState)
      const r = msg.room
      setRoom({ code: r.code, mode: r.mode, started: r.started, maxPlayers: r.max_players })
      // Rebuild slots from the state + tokens we know about.
      const taken = new Set(localState.players.map(p => p.index))
      const takenByToken = new Set(Object.keys(r.player_tokens).map(k => Number(k)))
      const newSlots: MultiplayerSlot[] = Array.from({ length: MAX_SLOTS }, (_, i) => ({
        index: i,
        taken: taken.has(i) || takenByToken.has(i),
        takenByMe: myIndexRef.current === i,
      }))
      setSlots(newSlots)
      startedRef.current = r.started
      const cur = phaseRef.current
      if (r.started && cur !== 'playing' && cur !== 'ended') {
        setPhaseTracked(localState.phase === 'done' ? 'ended' : 'playing')
      } else if (!r.started && (cur === 'playing' || cur === 'ended')) {
        setPhaseTracked('lobby')
      } else if (localState.phase === 'done' && cur === 'playing') {
        setPhaseTracked('ended')
      } else if (!r.started && cur === 'idle') {
        setPhaseTracked('lobby')
      }
      return
    }

    if (msg.type === 'created') {
      codeRef.current = msg.code
      // The server will broadcast state next; the response is just confirmation.
      return
    }

    if (msg.type === 'joined') {
      codeRef.current = msg.code
      myIndexRef.current = msg.player_index
      myTokenRef.current = msg.token
      setMyIndex(msg.player_index)
      setMyToken(msg.token)
      saveStoredToken(msg.code, { playerIndex: msg.player_index, token: msg.token })
      return
    }

    if (msg.type === 'spectating') {
      codeRef.current = msg.code
      return
    }

    if (msg.type === 'started') {
      startedRef.current = true
      setPhaseTracked('playing')
      return
    }

    if (msg.type === 'error') {
      setError(msg.message)
      // Token mismatch → forget the stale token so the lobby shows the slot picker.
      if (msg.message === 'token mismatch' && codeRef.current) {
        clearStoredToken(codeRef.current)
        myIndexRef.current = null
        myTokenRef.current = null
        setMyIndex(null)
        setMyToken(null)
      }
      return
    }
  }

  const createRoom = useCallback(async (mode: GameMode) => {
    setError(null)
    setPhaseTracked('connecting')
    setMyIndex(null)
    setMyToken(null)
    myIndexRef.current = null
    myTokenRef.current = null
    try {
      const created = await client.request<{ type: 'created'; code: string }>({
        type: 'create',
        mode,
        seed: Math.floor(Math.random() * 2_000_000_000),
        request_id: `create-${Date.now()}`,
      })
      // The create response gives us the room code; now claim slot 0 and wait
      // for the joined response (which populates myIndex / myToken).
      await client.request<{ type: 'joined' }>({
        type: 'join',
        code: created.code,
        player_index: 0,
        request_id: `cjoin-${Date.now()}`,
      })
      // Reflect the room code in the URL so the user can share it.
      window.history.pushState({}, '', `/room/${created.code}`)
      setPhaseTracked('lobby')
    } catch (err) {
      setError(String(err))
      setPhaseTracked('error')
    }
  }, [client, setPhaseTracked])

  const joinRoom = useCallback(async (code: string, slot?: number) => {
    const upper = code.toUpperCase().trim()
    setError(null)
    setPhaseTracked('connecting')
    setMyIndex(null)
    setMyToken(null)
    myIndexRef.current = null
    myTokenRef.current = null
    // If we have a stored token for this code, prefer rejoin.
    const stored = loadStoredTokens()[upper]
    const wantSlot = stored && slot === undefined ? stored.playerIndex : slot
    try {
      await client.request<{ type: 'joined' }>({
        type: 'join',
        code: upper,
        player_index: wantSlot,
        request_id: `join-${Date.now()}`,
      })
      // Reflect the room code in the URL.
      window.history.pushState({}, '', `/room/${upper}`)
      setPhaseTracked('lobby')
    } catch (err) {
      setError(String(err))
      setPhaseTracked('error')
    }
  }, [client, setPhaseTracked])

  const spectateRoom = useCallback(async (code: string) => {
    const upper = code.toUpperCase().trim()
    setError(null)
    client.send({ type: 'spectate', code: upper, request_id: `spec-${Date.now()}` })
    setPhaseTracked('lobby')
  }, [client, setPhaseTracked])

  const startGame = useCallback(async () => {
    if (!codeRef.current) return
    client.send({ type: 'start', request_id: `start-${Date.now()}` })
  }, [client])

  const sendAction = useCallback((action: WireActionKind) => {
    if (myIndexRef.current === null || myTokenRef.current === null) return
    client.sendAction(action, myIndexRef.current, myTokenRef.current)
  }, [client])

  const leaveRoom = useCallback(() => {
    if (codeRef.current) {
      clearStoredToken(codeRef.current)
    }
    codeRef.current = null
    myIndexRef.current = null
    myTokenRef.current = null
    startedRef.current = false
    setRoom(null)
    setSlots([])
    setState(emptyLocalState('classic'))
    setMyIndex(null)
    setMyToken(null)
    setPhaseTracked('idle')
    setError(null)
  }, [setPhaseTracked])

  const isMyTurn = useMemo(() => {
    if (myIndex === null) return false
    return state.currentPlayer === myIndex
  }, [myIndex, state.currentPlayer])

  return {
    phase,
    connected,
    room,
    slots,
    state,
    myIndex,
    myToken,
    error,
    isMyTurn,
    createRoom,
    joinRoom,
    spectateRoom,
    startGame,
    sendAction,
    leaveRoom,
  }
}
