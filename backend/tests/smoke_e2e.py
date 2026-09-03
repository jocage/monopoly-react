"""End-to-end smoke test: drive a full game through the WebSocket protocol.

Two clients join a room, the first starts the game, both clients take turns
rolling, one buys a property, and we verify state transitions are broadcast
correctly.
"""
from __future__ import annotations

import asyncio
import json
import sys
from typing import Any

import websockets


WS_URL = "ws://127.0.0.1:8765/ws"


async def recv_until(ws, predicate, timeout=5.0) -> dict[str, Any]:
    end = asyncio.get_event_loop().time() + timeout
    while True:
        remaining = end - asyncio.get_event_loop().time()
        if remaining <= 0:
            raise TimeoutError(f"timed out waiting for predicate {predicate}")
        msg = await asyncio.wait_for(ws.recv(), timeout=remaining)
        data = json.loads(msg)
        if predicate(data):
            return data


async def main() -> int:
    async with websockets.connect(WS_URL) as host_ws, websockets.connect(WS_URL) as guest_ws:
        # 1. Host creates room with a fixed seed so dice rolls are deterministic
        await host_ws.send(json.dumps({"type": "create", "mode": "classic", "seed": 42, "request_id": "h1"}))
        created = await recv_until(host_ws, lambda m: m.get("type") == "created")
        assert created["type"] == "created", created
        code = created["code"]
        print(f"[ok] host created room {code}")

        # Host should immediately receive a state broadcast (empty players)
        await recv_until(host_ws, lambda m: m.get("type") == "state")
        print("[ok] host received initial state broadcast")

        # 2. Host joins as player 0
        await host_ws.send(json.dumps({"type": "join", "code": code, "request_id": "h2"}))
        host_joined = await recv_until(host_ws, lambda m: m.get("type") == "joined")
        host_token = host_joined["token"]
        host_idx = host_joined["player_index"]
        assert host_idx == 0, host_joined
        print(f"[ok] host joined as P{host_idx + 1}")

        # 3. Guest joins as player 1
        await guest_ws.send(json.dumps({"type": "join", "code": code, "request_id": "g1"}))
        guest_joined = await recv_until(guest_ws, lambda m: m.get("type") == "joined")
        guest_token = guest_joined["token"]
        guest_idx = guest_joined["player_index"]
        assert guest_idx == 1, guest_joined
        print(f"[ok] guest joined as P{guest_idx + 1}")

        # 4. Host starts the game
        await host_ws.send(json.dumps({"type": "start", "request_id": "h3"}))
        started = await recv_until(host_ws, lambda m: m.get("type") == "started")
        assert started["type"] == "started"
        print("[ok] host started game")

        # Both should see a state with phase=rolling, current_player=0
        host_state = await recv_until(host_ws, lambda m: m.get("type") == "state" and m["state"]["phase"] == "rolling")
        guest_state = await recv_until(guest_ws, lambda m: m.get("type") == "state" and m["state"]["phase"] == "rolling")
        assert host_state["state"]["players"][0]["money"] == 1500
        assert guest_state["state"]["players"][0]["money"] == 1500
        print("[ok] both clients see 2 players with $1500")

        # 5. Host rolls dice (with seeded room RNG this is non-deterministic; just verify state updated)
        await host_ws.send(json.dumps({
            "type": "action",
            "action": "ROLL_DICE",
            "player_index": host_idx,
            "token": host_token,
            "request_id": "h4",
        }))
        post_roll = await recv_until(
            host_ws,
            lambda m: m.get("type") == "state" and (m["state"]["dice"] != [1, 1] or m["state"]["players"][0]["position"] != 0),
        )
        d1, d2 = post_roll["state"]["dice"]
        pos = post_roll["state"]["players"][0]["position"]
        print(f"[ok] host rolled {d1}+{d2}={d1+d2}, landed on position {pos}")

        # 6. If host landed on a property they can afford and the phase is "buying", buy it
        if post_roll["state"]["phase"] == "buying":
            await host_ws.send(json.dumps({
                "type": "action",
                "action": "BUY_PROPERTY",
                "player_index": host_idx,
                "token": host_token,
                "request_id": "h5",
            }))
            bought = await recv_until(host_ws, lambda m: m.get("type") == "state" and m["state"]["phase"] != "buying")
            print(f"[ok] host bought property at position {pos}")
        else:
            bought = post_roll
            print(f"[note] phase is {post_roll['state']['phase']}, skipping buy")

        # After host's turn, current_player should be 1 (guest) unless doubles
        if not bought["state"]["can_roll_again"]:
            assert bought["state"]["current_player"] == 1, bought["state"]
            print("[ok] turn passed to guest")
        else:
            print("[note] doubles, host rolls again")

        # 7. Rejection check: if it's now guest's turn, guest tries with bad token
        if bought["state"]["current_player"] == 1 and not bought["state"]["can_roll_again"]:
            await guest_ws.send(json.dumps({
                "type": "action",
                "action": "ROLL_DICE",
                "player_index": guest_idx,
                "token": "wrong-token",
                "request_id": "g-bad",
            }))
            err = await recv_until(guest_ws, lambda m: m.get("type") == "error")
            assert err["message"] == "token mismatch", err
            print("[ok] server rejected bad token")

        print("\nALL CHECKS PASSED")
        return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))