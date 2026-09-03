from __future__ import annotations

from dataclasses import dataclass
from typing import Callable


@dataclass
class CardContext:
    player_index: int
    move_to: Callable[[int], None]
    move_by: Callable[[int], None]
    add_money: Callable[[int], None]
    go_to_jail: Callable[[], None]
    collect_from_all: Callable[[int], None]
    pay_to_all: Callable[[int], None]


@dataclass
class Card:
    text_key: str
    action: Callable[[CardContext], None]


def _advance_go(ctx: CardContext) -> None:
    ctx.move_to(0)


def _bank_dividend(ctx: CardContext) -> None:
    ctx.add_money(50)


def _go_back_3(ctx: CardContext) -> None:
    ctx.move_by(-3)


def _go_jail(ctx: CardContext) -> None:
    ctx.go_to_jail()


def _repairs(ctx: CardContext) -> None:
    ctx.add_money(-25)


def _poor_tax(ctx: CardContext) -> None:
    ctx.add_money(-15)


def _trip_reading(ctx: CardContext) -> None:
    ctx.move_to(5)


def _boardwalk(ctx: CardContext) -> None:
    ctx.move_to(39)


def _chairman(ctx: CardContext) -> None:
    ctx.pay_to_all(50)


def _building_loan(ctx: CardContext) -> None:
    ctx.add_money(150)


CHANCE_CARDS: list[Card] = [
    Card("card.advanceGo", _advance_go),
    Card("card.bankDividend", _bank_dividend),
    Card("card.goBack3", _go_back_3),
    Card("card.goJail", _go_jail),
    Card("card.repairs", _repairs),
    Card("card.poorTax", _poor_tax),
    Card("card.tripReading", _trip_reading),
    Card("card.boardwalk", _boardwalk),
    Card("card.chairman", _chairman),
    Card("card.buildingLoan", _building_loan),
]


def _bank_error(ctx: CardContext) -> None:
    ctx.add_money(200)


def _doctor_fee(ctx: CardContext) -> None:
    ctx.add_money(-50)


def _sale_stock(ctx: CardContext) -> None:
    ctx.add_money(50)


def _opera_night(ctx: CardContext) -> None:
    ctx.collect_from_all(50)


def _holiday(ctx: CardContext) -> None:
    ctx.add_money(100)


def _income_tax_refund(ctx: CardContext) -> None:
    ctx.add_money(20)


def _birthday(ctx: CardContext) -> None:
    ctx.collect_from_all(10)


def _life_insurance(ctx: CardContext) -> None:
    ctx.add_money(100)


def _hospital_fee(ctx: CardContext) -> None:
    ctx.add_money(-100)


def _school_fee(ctx: CardContext) -> None:
    ctx.add_money(-50)


def _consultancy_fee(ctx: CardContext) -> None:
    ctx.add_money(25)


def _street_repairs(ctx: CardContext) -> None:
    ctx.add_money(-40)


def _beauty_contest(ctx: CardContext) -> None:
    ctx.add_money(10)


def _inherit(ctx: CardContext) -> None:
    ctx.add_money(100)


CHEST_CARDS: list[Card] = [
    Card("card.bankError", _bank_error),
    Card("card.doctorFee", _doctor_fee),
    Card("card.saleStock", _sale_stock),
    Card("card.goGo", _advance_go),
    Card("card.operaNight", _opera_night),
    Card("card.holiday", _holiday),
    Card("card.incomeTaxRefund", _income_tax_refund),
    Card("card.birthday", _birthday),
    Card("card.lifeInsurance", _life_insurance),
    Card("card.hospitalFee", _hospital_fee),
    Card("card.schoolFee", _school_fee),
    Card("card.consultancyFee", _consultancy_fee),
    Card("card.streetRepairs", _street_repairs),
    Card("card.beautyContest", _beauty_contest),
    Card("card.inherit", _inherit),
]