from __future__ import annotations

import random
import string
import threading
from dataclasses import dataclass, field

from fastapi import WebSocket

from .engine.reducer import Action, GameState, game_reducer


def _gen_code(length: int = 4) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(length))


def _gen_token(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(random.choice(alphabet) for _ in range(length))


@dataclass
class Connection:
    websocket: WebSocket
    player_index: int | None = None
    token: str | None = None


@dataclass
class Room:
    code: str
    mode: str  # "classic" | "kids"
    max_players: int
    state: GameState
    started: bool = False
    connections: dict[WebSocket, Connection] = field(default_factory=dict)
    player_tokens: dict[int, str] = field(default_factory=dict)
    rng_seed: int = 0
    rng: random.Random = field(default_factory=random.Random)

    def __post_init__(self) -> None:
        if self.rng_seed == 0:
            self.rng_seed = random.randint(0, 2**31)
        self.rng.seed(self.rng_seed)

    def next_rng(self) -> float:
        return self.rng.random()

    def assign_player(self, websocket: WebSocket, requested_index: int | None) -> tuple[int, str]:
        if requested_index is None:
            taken = {c.player_index for c in self.connections.values() if c.player_index is not None}
            slot = next((i for i in range(self.max_players) if i not in taken), None)
            if slot is None:
                raise ValueError("room is full")
        else:
            if requested_index in self.player_tokens:
                if requested_index in {c.player_index for c in self.connections.values() if c.player_index is not None}:
                    raise ValueError("player slot already taken")
            slot = requested_index

        token = _gen_token()
        self.player_tokens[slot] = token
        self.connections[websocket].player_index = slot
        self.connections[websocket].token = token
        return slot, token

    def release_player(self, websocket: WebSocket) -> None:
        conn = self.connections.get(websocket)
        if conn is None or conn.player_index is None:
            return
        idx = conn.player_index
        self.player_tokens.pop(idx, None)
        conn.player_index = None
        conn.token = None

    def serialize(self) -> dict:
        s = self.state
        return {
            "type": "state",
            "room": {
                "code": self.code,
                "mode": self.mode,
                "max_players": self.max_players,
                "started": self.started,
                "player_count": len(s.players),
                "player_tokens": {str(k): v for k, v in self.player_tokens.items()},
            },
            "state": {
                "mode": s.mode,
                "current_player": s.current_player,
                "ownership": s.ownership,
                "dice": list(s.dice),
                "log": [{"key": e.key, "params": e.params} for e in s.log],
                "phase": s.phase,
                "winner": s.winner,
                "last_roll_was_doubles": s.last_roll_was_doubles,
                "can_roll_again": s.can_roll_again,
                "players": [
                    {
                        "index": p.index,
                        "money": p.money,
                        "position": p.position,
                        "properties": p.properties,
                        "in_jail": p.in_jail,
                        "jail_turns": p.jail_turns,
                        "bankrupt": p.bankrupt,
                        "doubles_count": p.doubles_count,
                    }
                    for p in s.players
                ],
            },
        }


class RoomManager:
    def __init__(self) -> None:
        self._rooms: dict[str, Room] = {}
        self._lock = threading.Lock()

    def create_room(self, mode: str, max_players: int = 6, seed: int | None = None) -> Room:
        with self._lock:
            for _ in range(20):
                code = _gen_code()
                if code not in self._rooms:
                    break
            else:
                raise RuntimeError("could not generate unique room code")

            state = GameState(
                mode=mode,  # type: ignore[arg-type]
                players=[],
                current_player=0,
                ownership=[],
                dice=(1, 1),
                log=[],
                phase="setup",
                winner=None,
                last_roll_was_doubles=False,
                can_roll_again=False,
            )
            room = Room(
                code=code,
                mode=mode,
                max_players=max_players,
                state=state,
                rng_seed=seed if seed is not None else random.randint(0, 2**31),
            )
            self._rooms[code] = room
            return room

    def get_room(self, code: str) -> Room | None:
        return self._rooms.get(code)

    def remove_room(self, code: str) -> None:
        with self._lock:
            self._rooms.pop(code, None)

    def apply_action(self, room: Room, action: Action) -> None:
        room.state = game_reducer(room.state, action, rng=room.next_rng)


rooms = RoomManager()