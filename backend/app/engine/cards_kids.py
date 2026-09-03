from __future__ import annotations

from .cards import Card, CardContext


def _find_coin(ctx: CardContext) -> None:
    ctx.add_money(2)


def _lemonade(ctx: CardContext) -> None:
    ctx.add_money(3)


def _skip_forward(ctx: CardContext) -> None:
    ctx.move_by(2)


def _go_back(ctx: CardContext) -> None:
    ctx.move_by(-2)


def _birthday_gift(ctx: CardContext) -> None:
    ctx.collect_from_all(1)


def _advance_go(ctx: CardContext) -> None:
    ctx.move_to(0)


def _ice_cream_treat(ctx: CardContext) -> None:
    ctx.add_money(-1)


def _help_neighbor(ctx: CardContext) -> None:
    ctx.add_money(2)


KIDS_CHANCE_CARDS: list[Card] = [
    Card("kids.card.findCoin", _find_coin),
    Card("kids.card.lemonade", _lemonade),
    Card("kids.card.skipForward", _skip_forward),
    Card("kids.card.goBack", _go_back),
    Card("kids.card.birthdayGift", _birthday_gift),
    Card("kids.card.advanceGo", _advance_go),
    Card("kids.card.iceCreamTreat", _ice_cream_treat),
    Card("kids.card.helpNeighbor", _help_neighbor),
]


def _piggy_bank(ctx: CardContext) -> None:
    ctx.add_money(3)


def _lost_toy(ctx: CardContext) -> None:
    ctx.add_money(-1)


def _good_grades(ctx: CardContext) -> None:
    ctx.add_money(2)


def _chores(ctx: CardContext) -> None:
    ctx.add_money(2)


def _broke_vase(ctx: CardContext) -> None:
    ctx.add_money(-2)


def _tooth_fairy(ctx: CardContext) -> None:
    ctx.add_money(1)


def _share_snack(ctx: CardContext) -> None:
    ctx.pay_to_all(1)


def _penny_jar(ctx: CardContext) -> None:
    ctx.add_money(1)


KIDS_CHEST_CARDS: list[Card] = [
    Card("kids.card.piggyBank", _piggy_bank),
    Card("kids.card.lostToy", _lost_toy),
    Card("kids.card.goodGrades", _good_grades),
    Card("kids.card.chores", _chores),
    Card("kids.card.brokeVase", _broke_vase),
    Card("kids.card.toothFairy", _tooth_fairy),
    Card("kids.card.shareSnack", _share_snack),
    Card("kids.card.pennyJar", _penny_jar),
]