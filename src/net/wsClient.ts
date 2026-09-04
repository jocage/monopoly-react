// WebSocket client for the Monopoly backend. Handles connection lifecycle,
// JSON encode/decode, request/response correlation, and token persistence.
// No React; consumed by multiplayer.tsx.

import type {
  WireActionKind,
  WireClientMessage,
  WireServerMessage,
} from './types'

const STORAGE_KEY = 'monopoly:tokens'

export interface StoredToken {
  playerIndex: number
  token: string
}

export function loadStoredTokens(): Record<string, StoredToken> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function saveStoredToken(code: string, t: StoredToken): void {
  const all = loadStoredTokens()
  all[code] = t
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage unavailable — best-effort
  }
}

export function clearStoredToken(code: string): void {
  const all = loadStoredTokens()
  delete all[code]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

export function buildWsUrl(): string {
  // Default to localhost:8765 where the FastAPI backend serves the WS endpoint.
  // Override with VITE_WS_URL (e.g. wss://api.example.com/ws) for production.
  const override = (import.meta.env.VITE_WS_URL as string | undefined) ?? ''
  if (override) return override
  const loc = window.location
  const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:'
  if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
    return `${proto}//${loc.hostname}:8765/ws`
  }
  // Non-localhost (preview/prod): connect to same origin, expecting the host to
  // route /ws to the backend.
  return `${proto}//${loc.host}/ws`
}

type Listener = (msg: WireServerMessage) => void
type ErrorListener = (err: string) => void
type ConnectionListener = (connected: boolean) => void

export class WsClient {
  private ws: WebSocket | null = null
  private url: string
  private listeners: Set<Listener> = new Set()
  private errorListeners: Set<ErrorListener> = new Set()
  private connectionListeners: Set<ConnectionListener> = new Set()
  private pending: Map<string, (msg: WireServerMessage) => void> = new Map()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelayMs = 500
  private manualClose = false
  private connected = false

  constructor(url: string = buildWsUrl()) {
    this.url = url
  }

  on(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  onError(fn: ErrorListener): () => void {
    this.errorListeners.add(fn)
    return () => this.errorListeners.delete(fn)
  }

  onConnection(fn: ConnectionListener): () => void {
    this.connectionListeners.add(fn)
    fn(this.connected)
    return () => this.connectionListeners.delete(fn)
  }

  isConnected(): boolean {
    return this.connected
  }

  connect(): void {
    this.manualClose = false
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }
    try {
      this.ws = new WebSocket(this.url)
    } catch (err) {
      this.emitError(String(err))
      this.scheduleReconnect()
      return
    }
    this.ws.onopen = () => {
      this.connected = true
      this.reconnectDelayMs = 500
      this.connectionListeners.forEach(fn => fn(true))
    }
    this.ws.onmessage = (ev: MessageEvent) => {
      let parsed: WireServerMessage
      try {
        parsed = JSON.parse(ev.data)
      } catch {
        return
      }
      this.dispatch(parsed)
    }
    this.ws.onerror = () => {
      this.emitError('connection error')
    }
    this.ws.onclose = () => {
      this.connected = false
      this.ws = null
      this.connectionListeners.forEach(fn => fn(false))
      // Resolve any in-flight requests with an error so callers don't hang.
      for (const [rid, cb] of this.pending.entries()) {
        cb({ type: 'error', message: 'disconnected', request_id: rid })
      }
      this.pending.clear()
      if (!this.manualClose) {
        this.scheduleReconnect()
      }
    }
  }

  close(): void {
    this.manualClose = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        // ignore
      }
      this.ws = null
    }
    this.connected = false
  }

  send(msg: WireClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queueing/buffering is complex; the consumer will see a connection-down
      // signal via onConnection and can retry.
      this.emitError('not connected')
      return
    }
    try {
      this.ws.send(JSON.stringify(msg))
    } catch (err) {
      this.emitError(String(err))
    }
  }

  // Send a request that expects a one-time response (any message with the same
  // request_id, or a matching error). Returns a promise resolved with that
  // response. `state` broadcasts do NOT carry request_id and so do not resolve
  // pending requests — they fire via the `on()` listener.
  request<T extends { type: string } = WireServerMessage>(
    msg: WireClientMessage,
  ): Promise<T> {
    const rid = msg.request_id
    if (!rid) {
      this.send(msg)
      return Promise.resolve({ type: 'state' } as unknown as T)
    }
    return new Promise<T>(resolve => {
      this.pending.set(rid, msg => {
        this.pending.delete(rid)
        resolve(msg as T)
      })
      this.send(msg)
    })
  }

  sendAction(action: WireActionKind, playerIndex: number, token: string): void {
    this.send({
      type: 'action',
      action,
      player_index: playerIndex,
      token,
      request_id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    })
  }

  private dispatch(msg: WireServerMessage): void {
    if (msg.type === 'error' && msg.request_id && this.pending.has(msg.request_id)) {
      const cb = this.pending.get(msg.request_id)!
      this.pending.delete(msg.request_id)
      cb(msg)
      return
    }
    if ('request_id' in msg && msg.request_id && this.pending.has(msg.request_id)) {
      const cb = this.pending.get(msg.request_id)!
      this.pending.delete(msg.request_id)
      cb(msg)
      return
    }
    this.listeners.forEach(fn => fn(msg))
  }

  private scheduleReconnect(): void {
    if (this.manualClose) return
    if (this.reconnectTimer) return
    const delay = this.reconnectDelayMs
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 5000)
      this.connect()
    }, delay)
  }

  private emitError(message: string): void {
    this.errorListeners.forEach(fn => fn(message))
  }
}
