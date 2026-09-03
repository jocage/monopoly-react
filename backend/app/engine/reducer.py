from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Callable, Literal, Optional

from .cards import Card, CardContext, CHANCE_CARDS, CHEST_CARDS
from .cards_kids import KIDS_CHANCE_CARDS, KIDS_CHEST_CARDS
from .constants import (
    BAIL_COST,
    GO_SALARY,
    GROUP_SIZES,
    MAX_JAIL_TURNS,
    STARTING_MONEY,
)
from .constants_kids import KIDS_BAIL_COST, KIDS_GO_SALARY, KIDS_MAX_JAIL_TURNS, KIDS_STARTING_MONEY
from .spaces import SPACES, Space
from .spaces_kids import KIDS_GROUP_SIZES, KIDS_SPACES


GameMode = Literal["classic", "kids"]
Phase = Literal["setup", "rolling", "buying", "done"]


@dataclass
class Player:
    index: int
    money: int
    position: int
    properties: list[int]
    in_jail: bool
    jail_turns: int
    bankrupt: bool
    doubles_count: int


@dataclass
class LogEntry:
    key: str
    params: Optional[dict[str, str | int]] = None


@dataclass
class GameState:
    mode: GameMode
    players: list[Player]
    current_player: int
    ownership: list[Optional[int]]
    dice: tuple[int, int]
    log: list[LogEntry]
    phase: Phase
    winner: Optional[int]
    last_roll_was_doubles: bool
    can_roll_again: bool


@dataclass
class Action:
    type: Literal["INIT", "RESET", "ROLL_DICE", "BUY_PROPERTY", "SKIP_PROPERTY", "PAY_BAIL", "END_TURN"]
    player_count: Optional[int] = None
    mode: Optional[GameMode] = None


def get_spaces(mode: GameMode) -> list[Space]:
    return KIDS_SPACES if mode == "kids" else SPACES


def get_chance_cards(mode: GameMode) -> list[Card]:
    return KIDS_CHANCE_CARDS if mode == "kids" else CHANCE_CARDS


def get_chest_cards(mode: GameMode) -> list[Card]:
    return KIDS_CHEST_CARDS if mode == "kids" else CHEST_CARDS


def get_starting_money(mode: GameMode) -> int:
    return KIDS_STARTING_MONEY if mode == "kids" else STARTING_MONEY


def get_go_salary(mode: GameMode) -> int:
    return KIDS_GO_SALARY if mode == "kids" else GO_SALARY


def get_bail_cost(mode: GameMode) -> int:
    return KIDS_BAIL_COST if mode == "kids" else BAIL_COST


def get_max_jail_turns(mode: GameMode) -> int:
    return KIDS_MAX_JAIL_TURNS if mode == "kids" else MAX_JAIL_TURNS


def get_group_sizes(mode: GameMode) -> dict[str, int]:
    return KIDS_GROUP_SIZES if mode == "kids" else GROUP_SIZES


def get_board_size(mode: GameMode) -> int:
    return len(get_spaces(mode))


def get_jail_index(mode: GameMode) -> int:
    return next(i for i, s in enumerate(get_spaces(mode)) if s.type == "jail")


def create_players(count: int, mode: GameMode) -> list[Player]:
    money = get_starting_money(mode)
    return [
        Player(
            index=i,
            money=money,
            position=0,
            properties=[],
            in_jail=False,
            jail_turns=0,
            bankrupt=False,
            doubles_count=0,
        )
        for i in range(count)
    ]


def initial_state() -> GameState:
    return GameState(
        mode="classic",
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


def roll_die(rng: Callable[[], float]) -> int:
    return int(rng() * 6) + 1


def add_log(state: GameState, key: str, params: Optional[dict[str, str | int]] = None) -> None:
    state.log.insert(0, LogEntry(key=key, params=params))
    del state.log[100:]


def count_owned(ownership: list[Optional[int]], player_index: int, group: str, mode: GameMode) -> int:
    spaces = get_spaces(mode)
    return sum(1 for i, s in enumerate(spaces) if s.group == group and ownership[i] == player_index)


def calculate_rent(space_index: int, ownership: list[Optional[int]], dice: tuple[int, int], mode: GameMode) -> int:
    spaces = get_spaces(mode)
    space = spaces[space_index]
    owner = ownership[space_index]
    if owner is None or space.rent is None:
        return 0

    if space.type == "railroad":
        count = count_owned(ownership, owner, "railroad", mode)
        return 25 * (2 ** (count - 1))

    if space.type == "utility":
        count = count_owned(ownership, owner, "utility", mode)
        dice_total = dice[0] + dice[1]
        return dice_total * 10 if count == 2 else dice_total * 4

    base_rent = space.rent
    if space.group is not None:
        group_sizes = get_group_sizes(mode)
        group_size = group_sizes.get(space.group, 0)
        owned = count_owned(ownership, owner, space.group, mode)
        if owned == group_size:
            return base_rent * 2
    return base_rent


def check_bankruptcy(state: GameState) -> None:
    active = [p for p in state.players if not p.bankrupt]
    if len(active) == 1:
        state.phase = "done"
        state.winner = active[0].index


def next_active_player(state: GameState) -> int:
    n = len(state.players)
    nxt = (state.current_player + 1) % n
    while state.players[nxt].bankrupt:
        nxt = (nxt + 1) % n
    return nxt


def process_card_action(state: GameState, is_chance: bool, rng: Callable[[], float]) -> None:
    mode = state.mode
    cards = get_chance_cards(mode) if is_chance else get_chest_cards(mode)
    card = cards[int(rng() * len(cards))]
    p_idx = state.current_player
    player = state.players[p_idx]
    ownership = state.ownership

    log_key = (
        "log.chanceKids" if (is_chance and mode == "kids") else
        "log.chestKids" if (not is_chance and mode == "kids") else
        "log.chance" if is_chance else
        "log.chest"
    )
    add_log(state, log_key, {"name": f"P{p_idx + 1}", "text": "{" + card.text_key + "}"})

    board_size = get_board_size(mode)
    jail_idx = get_jail_index(mode)

    def move_to(pos: int) -> None:
        if pos == 0 and player.position != 0:
            player.money += get_go_salary(mode)
            add_log(
                state,
                "log.passedGoKids" if mode == "kids" else "log.passedGo",
                {"name": f"P{p_idx + 1}"},
            )
        player.position = pos

    def move_by(delta: int) -> None:
        player.position = ((player.position + delta) % board_size + board_size) % board_size

    def add_money(amount: int) -> None:
        player.money += amount

    def go_to_jail() -> None:
        player.position = jail_idx
        player.in_jail = True
        player.jail_turns = 0
        add_log(
            state,
            "log.goToNap" if mode == "kids" else "log.goToJail",
            {"name": f"P{p_idx + 1}"},
        )

    def collect_from_all(amount: int) -> None:
        for i, other in enumerate(state.players):
            if i != p_idx and not other.bankrupt:
                other.money -= amount
                player.money += amount

    def pay_to_all(amount: int) -> None:
        for i, other in enumerate(state.players):
            if i != p_idx and not other.bankrupt:
                other.money += amount
                player.money -= amount

    ctx = CardContext(
        player_index=p_idx,
        move_to=move_to,
        move_by=move_by,
        add_money=add_money,
        go_to_jail=go_to_jail,
        collect_from_all=collect_from_all,
        pay_to_all=pay_to_all,
    )
    card.action(ctx)

    if player.money < 0:
        player.bankrupt = True
        for i in range(len(ownership)):
            if ownership[i] == p_idx:
                ownership[i] = None
        add_log(
            state,
            "log.bankruptKids" if mode == "kids" else "log.bankrupt",
            {"name": f"P{p_idx + 1}"},
        )


def handle_landing(state: GameState, rng: Callable[[], float]) -> None:
    mode = state.mode
    spaces = get_spaces(mode)
    p_idx = state.current_player
    player = state.players[p_idx]
    space = spaces[player.position]
    ownership = state.ownership
    jail_idx = get_jail_index(mode)

    add_log(state, "log.landed", {"name": f"P{p_idx + 1}", "space": "{" + space.name_key + "}"})

    if space.type in ("property", "railroad", "utility"):
        owner = ownership[player.position]
        if owner is None:
            if space.price is not None and player.money >= space.price:
                state.phase = "buying"
                return
        elif owner != p_idx and not state.players[owner].bankrupt:
            rent = calculate_rent(player.position, ownership, state.dice, mode)
            player.money -= rent
            state.players[owner].money += rent
            add_log(
                state,
                "log.paidRent",
                {"name": f"P{p_idx + 1}", "amount": rent, "owner": f"P{owner + 1}"},
            )
            if player.money < 0:
                player.bankrupt = True
                for i in range(len(ownership)):
                    if ownership[i] == p_idx:
                        ownership[i] = None
                add_log(
                    state,
                    "log.bankruptKids" if mode == "kids" else "log.bankrupt",
                    {"name": f"P{p_idx + 1}"},
                )
    elif space.type == "tax":
        tax_amt = space.tax_amount or 0
        player.money -= tax_amt
        add_log(state, "log.tax", {"name": f"P{p_idx + 1}", "amount": tax_amt})
        if player.money < 0:
            player.bankrupt = True
            for i in range(len(ownership)):
                if ownership[i] == p_idx:
                    ownership[i] = None
            add_log(
                state,
                "log.bankruptKids" if mode == "kids" else "log.bankrupt",
                {"name": f"P{p_idx + 1}"},
            )
    elif space.type == "goToJail":
        player.position = jail_idx
        player.in_jail = True
        player.jail_turns = 0
        add_log(
            state,
            "log.goToNap" if mode == "kids" else "log.goToJail",
            {"name": f"P{p_idx + 1}"},
        )
    elif space.type == "chance":
        process_card_action(state, True, rng)
    elif space.type == "chest":
        process_card_action(state, False, rng)
    elif space.type == "freeParking":
        add_log(state, "log.freeParking", {"name": f"P{p_idx + 1}"})
    elif space.type == "jail":
        add_log(
            state,
            "log.visitingKids" if mode == "kids" else "log.visiting",
            {"name": f"P{p_idx + 1}"},
        )

    check_bankruptcy(state)


def game_reducer(state: GameState, action: Action, rng: Optional[Callable[[], float]] = None) -> GameState:
    if rng is None:
        rng = random.random

    if action.type == "INIT":
        assert action.player_count is not None
        assert action.mode is not None
        board_size = get_board_size(action.mode)
        state = initial_state()
        state.mode = action.mode
        state.players = create_players(action.player_count, action.mode)
        state.ownership = [None] * board_size
        state.phase = "rolling"
        return state

    if action.type == "RESET":
        return initial_state()

    if action.type == "ROLL_DICE":
        mode = state.mode
        board_size = get_board_size(mode)
        go_salary = get_go_salary(mode)
        bail_cost = get_bail_cost(mode)
        max_jail_turns = get_max_jail_turns(mode)
        jail_idx = get_jail_index(mode)

        d1 = roll_die(rng)
        d2 = roll_die(rng)
        is_doubles = d1 == d2
        p_idx = state.current_player
        player = state.players[p_idx]
        state.dice = (d1, d2)

        if player.in_jail:
            add_log(
                state,
                "log.rolled",
                {"name": f"P{p_idx + 1}", "d1": d1, "d2": d2, "total": d1 + d2},
            )
            if is_doubles:
                player.in_jail = False
                player.jail_turns = 0
                player.doubles_count = 0
                add_log(
                    state,
                    "log.napFree" if mode == "kids" else "log.jailFree",
                    {"name": f"P{p_idx + 1}"},
                )
            else:
                player.jail_turns += 1
                if player.jail_turns >= max_jail_turns:
                    player.money -= bail_cost
                    player.in_jail = False
                    player.jail_turns = 0
                    add_log(
                        state,
                        "log.paidNapBail" if mode == "kids" else "log.paidBail",
                        {"name": f"P{p_idx + 1}"},
                    )
                else:
                    add_log(
                        state,
                        "log.napRollFail" if mode == "kids" else "log.jailRollFail",
                        {"name": f"P{p_idx + 1}"},
                    )
                    state.current_player = next_active_player(state)
                    state.can_roll_again = False
                    return state

            if not player.in_jail:
                new_pos = (player.position + d1 + d2) % board_size
                if new_pos < player.position:
                    player.money += go_salary
                    add_log(
                        state,
                        "log.passedGoKids" if mode == "kids" else "log.passedGo",
                        {"name": f"P{p_idx + 1}"},
                    )
                player.position = new_pos
                handle_landing(state, rng)
                return state

            state.current_player = next_active_player(state)
            return state

        player.doubles_count = player.doubles_count + 1 if is_doubles else 0

        add_log(
            state,
            "log.rolled",
            {"name": f"P{p_idx + 1}", "d1": d1, "d2": d2, "total": d1 + d2},
        )

        if mode != "kids" and player.doubles_count >= 3:
            add_log(state, "log.triplDoubles", {"name": f"P{p_idx + 1}"})
            player.position = jail_idx
            player.in_jail = True
            player.jail_turns = 0
            player.doubles_count = 0
            add_log(
                state,
                "log.goToJail",
                {"name": f"P{p_idx + 1}"},
            )
            state.current_player = next_active_player(state)
            state.can_roll_again = False
            return state

        new_pos = (player.position + d1 + d2) % board_size
        if new_pos < player.position:
            player.money += go_salary
            add_log(
                state,
                "log.passedGoKids" if mode == "kids" else "log.passedGo",
                {"name": f"P{p_idx + 1}"},
            )
        player.position = new_pos
        state.last_roll_was_doubles = is_doubles
        state.can_roll_again = is_doubles

        handle_landing(state, rng)

        if state.phase in ("buying", "done"):
            return state

        if is_doubles and not state.players[p_idx].in_jail and not state.players[p_idx].bankrupt:
            state.can_roll_again = True
            return state

        state.current_player = next_active_player(state)
        state.can_roll_again = False
        return state

    if action.type == "BUY_PROPERTY":
        mode = state.mode
        spaces = get_spaces(mode)
        p_idx = state.current_player
        player = state.players[p_idx]
        space = spaces[player.position]
        price = space.price or 0

        player.money -= price
        player.properties = [*player.properties, player.position]
        state.ownership[player.position] = p_idx

        add_log(
            state,
            "log.bought",
            {"name": f"P{p_idx + 1}", "space": "{" + space.name_key + "}", "price": price},
        )
        state.phase = "rolling"

        if state.can_roll_again and not player.in_jail:
            return state

        state.current_player = next_active_player(state)
        state.can_roll_again = False
        return state

    if action.type == "SKIP_PROPERTY":
        state.phase = "rolling"

        if state.can_roll_again and not state.players[state.current_player].in_jail:
            return state

        state.current_player = next_active_player(state)
        state.can_roll_again = False
        return state

    if action.type == "PAY_BAIL":
        mode = state.mode
        bail_cost = get_bail_cost(mode)
        p_idx = state.current_player
        player = state.players[p_idx]
        player.money -= bail_cost
        player.in_jail = False
        player.jail_turns = 0

        add_log(
            state,
            "log.paidNapBail" if mode == "kids" else "log.paidBail",
            {"name": f"P{p_idx + 1}"},
        )

        if player.money < 0:
            for i in range(len(state.ownership)):
                if state.ownership[i] == p_idx:
                    state.ownership[i] = None
            player.bankrupt = True
            add_log(
                state,
                "log.bankruptKids" if mode == "kids" else "log.bankrupt",
                {"name": f"P{p_idx + 1}"},
            )
            check_bankruptcy(state)
            return state

        return state

    if action.type == "END_TURN":
        state.current_player = next_active_player(state)
        state.can_roll_again = False
        return state

    return state