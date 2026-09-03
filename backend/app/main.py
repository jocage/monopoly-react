from __future__ import annotations

import asyncio
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from .engine.reducer import Action
from .rooms import Connection, Room, rooms


app = FastAPI(title="Monopoly React Backend")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/rooms/{code}")
def get_room(code: str) -> JSONResponse:
    room = rooms.get_room(code.upper())
    if room is None:
        return JSONResponse({"error": "room not found"}, status_code=404)
    return JSONResponse({
        "code": room.code,
        "mode": room.mode,
        "max_players": room.max_players,
        "started": room.started,
        "player_count": len(room.state.players),
        "current_player": room.state.current_player,
        "phase": room.state.phase,
    })


async def _broadcast(room: Room) -> None:
    payload = room.serialize()
    await asyncio.gather(
        *(conn.websocket.send_json(payload) for conn in room.connections.values()),
        return_exceptions=True,
    )


def _error_payload(message: str, request_id: str | None = None) -> dict[str, Any]:
    body: dict[str, Any] = {"type": "error", "message": message}
    if request_id is not None:
        body["request_id"] = request_id
    return body


def _authorize(room: Room, websocket: WebSocket, expected_player_index: int | None, expected_token: str | None) -> None:
    conn = room.connections.get(websocket)
    if conn is None:
        raise ValueError("not connected")
    if conn.player_index is None or conn.token is None:
        raise ValueError("not joined to a player slot")
    if expected_player_index is not None and expected_player_index != conn.player_index:
        raise ValueError("player_index mismatch")
    if expected_token is not None and expected_token != conn.token:
        raise ValueError("token mismatch")


def _validate_phase_for_action(room: Room, action: Action) -> None:
    if action.type == "INIT":
        if room.started:
            raise ValueError("room already started")
        return
    if action.type in ("BUY_PROPERTY", "SKIP_PROPERTY", "PAY_BAIL", "ROLL_DICE", "END_TURN"):
        if not room.started:
            raise ValueError("room not started")
        if room.state.phase == "done":
            raise ValueError("game is over")
        return


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    code: str | None = None
    room: Room | None = None

    try:
        while True:
            msg = await websocket.receive_json()
            kind = msg.get("type")

            if kind == "create":
                mode = msg.get("mode", "classic")
                if mode not in ("classic", "kids"):
                    await websocket.send_json(_error_payload("invalid mode", msg.get("request_id")))
                    continue
                seed = msg.get("seed")
                room = rooms.create_room(mode=mode, seed=seed)
                code = room.code
                room.connections[websocket] = Connection(websocket=websocket)
                await websocket.send_json({
                    "type": "created",
                    "request_id": msg.get("request_id"),
                    "code": room.code,
                    "mode": room.mode,
                })
                await _broadcast(room)
                continue

            if kind == "join":
                if room is None or code is None:
                    code_in = msg.get("code")
                    if not code_in:
                        await websocket.send_json(_error_payload("no room code", msg.get("request_id")))
                        continue
                    code = code_in.upper()
                    room = rooms.get_room(code)
                    if room is None:
                        await websocket.send_json(_error_payload("room not found", msg.get("request_id")))
                        code = None
                        continue
                    if websocket not in room.connections:
                        room.connections[websocket] = Connection(websocket=websocket)

                if room.started:
                    await websocket.send_json(_error_payload("room already started; can only spectate", msg.get("request_id")))
                    continue

                requested = msg.get("player_index")
                try:
                    slot, token = room.assign_player(websocket, requested)
                except ValueError as exc:
                    await websocket.send_json(_error_payload(str(exc), msg.get("request_id")))
                    continue

                await websocket.send_json({
                    "type": "joined",
                    "request_id": msg.get("request_id"),
                    "code": room.code,
                    "player_index": slot,
                    "token": token,
                })
                await _broadcast(room)
                continue

            if kind == "spectate":
                if room is None or code is None:
                    code_in = msg.get("code")
                    if not code_in:
                        await websocket.send_json(_error_payload("no room code", msg.get("request_id")))
                        continue
                    code = code_in.upper()
                    room = rooms.get_room(code)
                    if room is None:
                        await websocket.send_json(_error_payload("room not found", msg.get("request_id")))
                        code = None
                        continue
                    if websocket not in room.connections:
                        room.connections[websocket] = Connection(websocket=websocket)
                await websocket.send_json({
                    "type": "spectating",
                    "request_id": msg.get("request_id"),
                    "code": room.code,
                })
                await _broadcast(room)
                continue

            if kind == "start":
                if room is None:
                    await websocket.send_json(_error_payload("not in a room", msg.get("request_id")))
                    continue
                if room.started:
                    await websocket.send_json(_error_payload("already started", msg.get("request_id")))
                    continue
                joined = sorted({c.player_index for c in room.connections.values() if c.player_index is not None})
                if not joined:
                    await websocket.send_json(_error_payload("no players joined", msg.get("request_id")))
                    continue
                action = Action(
                    type="INIT",
                    player_count=len(joined),
                    mode=room.mode,  # type: ignore[arg-type]
                )
                rooms.apply_action(room, action)
                room.started = True
                await websocket.send_json({
                    "type": "started",
                    "request_id": msg.get("request_id"),
                })
                await _broadcast(room)
                continue

            if kind == "action":
                if room is None:
                    await websocket.send_json(_error_payload("not in a room", msg.get("request_id")))
                    continue
                action_kind = msg.get("action")
                if action_kind not in ("ROLL_DICE", "BUY_PROPERTY", "SKIP_PROPERTY", "PAY_BAIL", "END_TURN", "RESET"):
                    await websocket.send_json(_error_payload("unknown action", msg.get("request_id")))
                    continue

                try:
                    _authorize(room, websocket, msg.get("player_index"), msg.get("token"))
                    _validate_phase_for_action(room, Action(type=action_kind))  # type: ignore[arg-type]
                    if action_kind in ("ROLL_DICE", "BUY_PROPERTY", "SKIP_PROPERTY", "PAY_BAIL", "END_TURN"):
                        conn = room.connections[websocket]
                        if conn.player_index != room.state.current_player:
                            raise ValueError("not your turn")
                    action = Action(type=action_kind)  # type: ignore[arg-type]
                    rooms.apply_action(room, action)
                except ValueError as exc:
                    await websocket.send_json(_error_payload(str(exc), msg.get("request_id")))
                    continue

                await _broadcast(room)
                continue

            await websocket.send_json(_error_payload(f"unknown message type: {kind}", msg.get("request_id")))

    except WebSocketDisconnect:
        pass
    finally:
        if room is not None and websocket in room.connections:
            room.release_player(websocket)
            del room.connections[websocket]
            if not room.connections:
                rooms.remove_room(room.code)
            else:
                await asyncio.gather(
                    *(_broadcast_for_conn(room, conn) for conn in room.connections.values()),
                    return_exceptions=True,
                )


async def _broadcast_for_conn(room: Room, conn: Connection) -> None:
    try:
        await conn.websocket.send_json(room.serialize())
    except Exception:
        pass