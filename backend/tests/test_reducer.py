"""Reducer port-mirror tests.

These tests exercise the engine reducer on inputs whose outcomes are observable
in the TypeScript reference (src/game/useGame.ts). The RNG is pinned so each
test is deterministic. They are not exhaustive — they cover each reducer
branch and the most-cheat-prone flows (rent transfer, bankruptcy, jail escape).
"""
from __future__ import annotations

from app.engine.reducer import (
    Action,
    GameState,
    game_reducer,
    initial_state,
)
from app.engine.spaces import SPACES


class PinnedRNG:
    def __init__(self, values):
        self._values = list(values)
        self._idx = 0

    def __call__(self) -> float:
        v = self._values[self._idx % len(self._values)]
        self._idx += 1
        return v


def _init(count=2, mode="classic", rng=None):
    state = initial_state()
    return game_reducer(state, Action(type="INIT", player_count=count, mode=mode), rng=rng)


def test_init_classic_creates_two_players_with_starting_money():
    state = _init(count=2, mode="classic")
    assert state.mode == "classic"
    assert state.phase == "rolling"
    assert len(state.players) == 2
    assert state.players[0].money == 1500
    assert state.players[1].money == 1500
    assert len(state.ownership) == len(SPACES)
    assert all(o is None for o in state.ownership)
    assert state.current_player == 0


def test_init_kids_uses_kids_constants():
    state = _init(count=3, mode="kids")
    assert state.mode == "kids"
    assert state.players[0].money == 20
    assert len(state.ownership) == 20


def test_reset_returns_to_initial():
    state = _init(count=2, mode="classic")
    state.players[0].money = 1234
    state = game_reducer(state, Action(type="RESET"))
    fresh = initial_state()
    assert state.players == fresh.players
    assert state.mode == fresh.mode
    assert state.phase == fresh.phase


def test_roll_moves_player_into_buying_phase_on_unowned_property():
    rng = PinnedRNG([0.5, 0.667])
    state = _init(count=2, mode="classic", rng=rng)
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].position == 9
    assert state.players[0].money == 1500
    assert state.dice == (4, 5)
    assert state.phase == "buying"


def test_roll_passing_go_credits_salary_on_wrap_around_board():
    rng = PinnedRNG([0.5, 0.667, 0.5])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].position = 38
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].position == (38 + 4 + 5) % 40
    assert state.players[0].money >= 1500 + 200 - 15


def test_doubles_grant_extra_roll_and_keep_current_player():
    rng = PinnedRNG([0.5, 0.5])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].position = 32
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].position == (32 + 4 + 4) % 40
    assert state.can_roll_again is True
    assert state.current_player == 0
    assert state.last_roll_was_doubles is True


def test_triple_doubles_send_to_jail_in_classic_mode():
    rng = PinnedRNG([0.5, 0.5])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].position = 32
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].in_jail is True
    assert state.players[0].doubles_count == 0
    assert state.current_player == 1


def test_buy_property_deducts_money_and_owns_square():
    state = _init(count=2, mode="classic")
    state.players[0].position = 1
    state.phase = "buying"
    state = game_reducer(state, Action(type="BUY_PROPERTY"))
    assert state.players[0].money == 1500 - 60
    assert state.ownership[1] == 0
    assert 1 in state.players[0].properties
    assert state.phase == "rolling"


def test_skip_property_passes_turn():
    state = _init(count=2, mode="classic")
    state.players[0].position = 1
    state.phase = "buying"
    state = game_reducer(state, Action(type="SKIP_PROPERTY"))
    assert state.ownership[1] is None
    assert state.players[0].money == 1500
    assert state.current_player == 1


def test_rent_transfers_money_between_owners():
    rng = PinnedRNG([0.0, 0.0])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].properties = [1]
    state.ownership[1] = 0
    state.players[1].position = 39
    state.players[1].money = 100
    state.current_player = 1
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].money == 1500 + 2
    assert state.players[1].money == 100 + 200 - 2
    assert state.ownership[1] == 0


def test_rent_double_when_owning_full_color_group():
    rng = PinnedRNG([0.0, 0.0])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].properties = [1, 3]
    state.ownership[1] = 0
    state.ownership[3] = 0
    state.players[1].position = 1
    state.players[1].money = 100
    state.current_player = 1
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[1].money == 100 - (4 * 2)
    assert state.players[0].money == 1500 + (4 * 2)


def test_railroad_rent_scales_with_count():
    rng = PinnedRNG([0.0, 0.0])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].properties = [5, 15]
    state.ownership[5] = 0
    state.ownership[15] = 0
    state.players[1].position = 13
    state.players[1].money = 100
    state.current_player = 1
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[1].money == 100 - 50


def test_utility_rent_uses_dice_total():
    rng = PinnedRNG([0.0, 0.0])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].properties = [12, 28]
    state.ownership[12] = 0
    state.ownership[28] = 0
    state.players[1].position = 26
    state.players[1].money = 100
    state.current_player = 1
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[1].money == 100 - (2 * 10)


def test_bankruptcy_on_unpayable_rent_transfers_ownership():
    rng = PinnedRNG([0.5, 0.5])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].properties = [37]
    state.ownership[37] = 0
    state.players[1].money = 0
    state.players[1].properties = [5]
    state.ownership[5] = 1
    state.players[1].position = 29
    state.current_player = 1
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[1].bankrupt is True
    assert state.ownership[5] is None
    assert state.ownership[37] == 0


def test_single_survivor_wins_after_all_opponents_bankrupt():
    rng = PinnedRNG([0.5, 0.5])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].properties = [37]
    state.ownership[37] = 0
    state.players[1].money = 0
    state.players[1].position = 29
    state.current_player = 1
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.phase == "done"
    assert state.winner == 0


def test_pay_bail_releases_player_and_charges_money():
    state = _init(count=2, mode="classic")
    state.players[0].in_jail = True
    state.players[0].jail_turns = 1
    state = game_reducer(state, Action(type="PAY_BAIL"))
    assert state.players[0].in_jail is False
    assert state.players[0].money == 1500 - 50


def test_pay_bail_bankruptcy_drops_ownership():
    state = _init(count=2, mode="classic")
    state.players[0].in_jail = True
    state.players[0].jail_turns = 3
    state.players[0].money = 10
    state.players[0].properties = [1]
    state.ownership[1] = 0
    state = game_reducer(state, Action(type="PAY_BAIL"))
    assert state.players[0].bankrupt is True
    assert state.ownership[1] is None


def test_jail_doubles_release_player_and_move():
    rng = PinnedRNG([0.5, 0.5])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].position = 32
    state.players[0].in_jail = True
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].in_jail is False
    assert state.players[0].position == (32 + 4 + 4) % 40


def test_jail_three_failed_rolls_force_pay_bail():
    rng = PinnedRNG([0.0, 0.5, 0.0, 0.5, 0.0, 0.5])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].in_jail = True
    state.players[0].position = 10
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    state.current_player = 0
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    state.current_player = 0
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].in_jail is False
    assert state.players[0].money == 1500 - 50


def test_go_to_jail_space_sends_player_to_jail():
    state = _init(count=2, mode="classic")
    state.players[0].position = 28
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=PinnedRNG([0.0, 0.0]))
    assert state.players[0].in_jail is True
    assert state.players[0].position == 10


def test_chance_card_chairman_pays_each_opponent_50():
    rng = PinnedRNG([0.0, 0.0, 8 / 10])
    state = _init(count=3, mode="classic", rng=rng)
    state.players[0].position = 5
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].money == 1500 - 50 * 2
    assert state.players[1].money == 1500 + 50
    assert state.players[2].money == 1500 + 50


def test_chest_card_advance_go_adds_salary():
    rng = PinnedRNG([0.0, 0.0, 3 / 15])
    state = _init(count=2, mode="classic", rng=rng)
    state.players[0].position = 15
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].position == 0
    assert state.players[0].money == 1500 + 200


def test_kids_card_collection_routes_through_collect_from_all():
    rng = PinnedRNG([0.0, 0.0, 4 / 8])
    state = _init(count=3, mode="kids", rng=rng)
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].money == 20 + 1 * 2
    assert state.players[1].money == 20 - 1
    assert state.players[2].money == 20 - 1


def test_kids_advance_go_credits_salary_when_not_already_at_zero():
    rng = PinnedRNG([0.0, 0.0, 5 / 8])
    state = _init(count=2, mode="kids", rng=rng)
    state.players[0].position = 18
    state.players[0].money = 100
    state = game_reducer(state, Action(type="ROLL_DICE"), rng=rng)
    assert state.players[0].position == 0
    assert state.players[0].money == 100 + 2


def test_deterministic_double_rerun_is_stable():
    rng_a = PinnedRNG([0.5, 0.5, 0.5, 0.5])
    state_a = _init(count=2, mode="classic", rng=rng_a)
    state_a = game_reducer(state_a, Action(type="ROLL_DICE"), rng=rng_a)

    rng_b = PinnedRNG([0.5, 0.5, 0.5, 0.5])
    state_b = _init(count=2, mode="classic", rng=rng_b)
    state_b = game_reducer(state_b, Action(type="ROLL_DICE"), rng=rng_b)

    assert state_a.players[0].money == state_b.players[0].money
    assert state_a.players[0].position == state_b.players[0].position
    assert state_a.current_player == state_b.current_player