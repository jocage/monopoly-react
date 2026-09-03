"""Room manager tests."""
from __future__ import annotations

import pytest

from app.engine.reducer import Action
from app.rooms import RoomManager


class _FakeWebSocket:
    pass


def test_create_room_returns_unique_codes():
    mgr = RoomManager()
    a = mgr.create_room(mode="classic", seed=1)
    b = mgr.create_room(mode="classic", seed=2)
    assert a.code != b.code
    assert a.mode == "classic"
    assert b.mode == "classic"
    assert a.rng_seed == 1
    assert b.rng_seed == 2


def test_create_room_kids_mode():
    mgr = RoomManager()
    room = mgr.create_room(mode="kids", seed=3)
    assert room.mode == "kids"


def test_get_and_remove_room():
    mgr = RoomManager()
    room = mgr.create_room(mode="classic", seed=4)
    assert mgr.get_room(room.code) is room
    mgr.remove_room(room.code)
    assert mgr.get_room(room.code) is None


def test_apply_action_init_populates_state():
    mgr = RoomManager()
    room = mgr.create_room(mode="classic", seed=5)
    action = Action(type="INIT", player_count=3, mode="classic")
    mgr.apply_action(room, action)
    room.started = True
    assert room.state.phase == "rolling"
    assert len(room.state.players) == 3
    assert room.state.players[0].money == 1500


def test_serialize_contains_state_and_room_metadata():
    mgr = RoomManager()
    room = mgr.create_room(mode="classic", seed=6)
    action = Action(type="INIT", player_count=2, mode="classic")
    mgr.apply_action(room, action)
    room.started = True
    ws1 = _FakeWebSocket()
    ws2 = _FakeWebSocket()
    room.connections[ws1] = type("C", (), {"websocket": ws1, "player_index": None, "token": None})()
    room.connections[ws2] = type("C", (), {"websocket": ws2, "player_index": None, "token": None})()
    room.assign_player(ws1, None)
    payload = room.serialize()
    assert payload["type"] == "state"
    assert payload["room"]["code"] == room.code
    assert payload["room"]["started"] is True
    assert payload["room"]["player_count"] == 2
    assert payload["state"]["phase"] == "rolling"
    assert "token" in payload["room"]["player_tokens"].values() or any(
        v for v in payload["room"]["player_tokens"].values()
    )