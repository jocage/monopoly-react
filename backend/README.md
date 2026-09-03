# Monopoly Backend

Python (FastAPI) backend for the React Monopoly app. Server-authoritative: the
game engine from `src/game/useGame.ts` runs here, validates every action, and
broadcasts state to clients over WebSocket.

## Layout

- `app/engine/` — port of the TS reducer (`spaces`, `cards`, `constants`, `reducer`).
- `app/rooms.py` — in-memory room manager + connections.
- `app/main.py` — FastAPI app, WebSocket protocol, health and room lookup HTTP.
- `tests/` — unit tests for the reducer and room manager, plus a smoke
  end-to-end test that drives a full game through real WebSocket connections.

## Running locally

```bash
pip install -r backend/requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8765
```

## WebSocket protocol

Connect to `ws://host:8765/ws` and send JSON messages. All messages are
single-frame JSON objects.

### Client → server

| `type`    | Fields                                                                  | Purpose                                  |
|-----------|-------------------------------------------------------------------------|------------------------------------------|
| `create`  | `mode`, optional `seed`, optional `request_id`                          | Host creates a room.                     |
| `join`    | `code`, optional `player_index`, optional `request_id`                  | Join a room and claim a player slot.     |
| `spectate`| `code`, optional `request_id`                                           | Join a room as an observer.              |
| `start`   | optional `request_id`                                                   | Start the game (host-only by convention).|
| `action`  | `action` ∈ `ROLL_DICE`/`BUY_PROPERTY`/`SKIP_PROPERTY`/`PAY_BAIL`/`END_TURN`, `player_index`, `token`, optional `request_id` | Send a game action. |

### Server → client

| `type`     | Fields                                              | Purpose                                  |
|------------|-----------------------------------------------------|------------------------------------------|
| `created`  | `code`, `mode`                                      | Confirms `create`.                       |
| `joined`   | `code`, `player_index`, `token`                     | Confirms `join`; the token is required for every `action`. |
| `spectating` | `code`                                            | Confirms `spectate`.                     |
| `started`  | —                                                   | Confirms `start`.                        |
| `state`    | `room`, `state`                                     | Full game-state snapshot. Broadcast on every action. |
| `error`    | `message`, `request_id`                             | Action rejected.                         |

## Tests

```bash
python -m pytest tests/                    # reducer + room unit tests
python tests/smoke_e2e.py                  # end-to-end over WS
```

The smoke test expects the server running on `127.0.0.1:8765`.

## Engine parity

The reducer is a line-by-line port of `src/game/useGame.ts`. Pinned-RNG tests
in `tests/test_reducer.py` cover every reducer branch (init, roll, buy, skip,
pay bail, jail escape, triple doubles, go-to-jail, rent transfer, full-color
rent doubling, railroad/utility rent, bankruptcy, single-survivor win,
Chance/Chest cards). Two behaviors intentionally match the existing TS code:

- A failed roll while in jail advances the current player to the next active
  one. Real Monopoly keeps the jailed player rolling; this differs from the
  standard rules but matches the React app's current behavior.
- The classic-mode triple-doubles → jail rule is omitted in kids mode.

If you change the React reducer, change this one in lockstep — the tests will
catch a silent drift but only if you keep them in sync too.