from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from .spaces import Space


KIDS_SPACES: list[Space] = [
    Space(name_key="kids.space.go", type="go"),
    Space(name_key="kids.space.iceCream", type="property", price=1, rent=1, group="pink", group_key="group.pink"),
    Space(name_key="kids.space.chance", type="chance"),
    Space(name_key="kids.space.toyStore", type="property", price=2, rent=1, group="pink", group_key="group.pink"),
    Space(name_key="kids.space.petShop", type="property", price=2, rent=1, group="lightBlue", group_key="group.lightBlue"),
    Space(name_key="kids.space.nap", type="jail"),
    Space(name_key="kids.space.playground", type="property", price=3, rent=2, group="lightBlue", group_key="group.lightBlue"),
    Space(name_key="kids.space.chest", type="chest"),
    Space(name_key="kids.space.candyShop", type="property", price=3, rent=2, group="orange", group_key="group.orange"),
    Space(name_key="kids.space.aquarium", type="property", price=3, rent=2, group="orange", group_key="group.orange"),
    Space(name_key="kids.space.freeParking", type="freeParking"),
    Space(name_key="kids.space.zoo", type="property", price=4, rent=2, group="green", group_key="group.green"),
    Space(name_key="kids.space.chance2", type="chance"),
    Space(name_key="kids.space.waterPark", type="property", price=4, rent=3, group="green", group_key="group.green"),
    Space(name_key="kids.space.movieTheater", type="property", price=4, rent=3, group="yellow", group_key="group.yellow"),
    Space(name_key="kids.space.goToNap", type="goToJail"),
    Space(name_key="kids.space.circus", type="property", price=4, rent=3, group="yellow", group_key="group.yellow"),
    Space(name_key="kids.space.chest2", type="chest"),
    Space(name_key="kids.space.amusementPark", type="property", price=5, rent=3, group="red", group_key="group.red"),
    Space(name_key="kids.space.castle", type="property", price=5, rent=4, group="red", group_key="group.red"),
]


KIDS_GROUP_SIZES: dict[str, int] = {
    "pink": 2,
    "lightBlue": 2,
    "orange": 2,
    "green": 2,
    "yellow": 2,
    "red": 2,
}