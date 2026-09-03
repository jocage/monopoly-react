from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class Space(BaseModel):
    name_key: str
    type: Literal[
        "go", "property", "chest", "tax", "railroad",
        "chance", "jail", "utility", "freeParking", "goToJail",
    ]
    price: Optional[int] = None
    rent: Optional[int] = None
    group: Optional[str] = None
    group_key: Optional[str] = None
    tax_amount: Optional[int] = None
    mortgage: Optional[int] = None


SPACES: list[Space] = [
    Space(name_key="space.go", type="go"),
    Space(name_key="space.mediterranean", type="property", price=60, rent=2, group="brown", group_key="group.brown", mortgage=30),
    Space(name_key="space.chest", type="chest"),
    Space(name_key="space.baltic", type="property", price=60, rent=4, group="brown", group_key="group.brown", mortgage=30),
    Space(name_key="space.incomeTax", type="tax", tax_amount=200),
    Space(name_key="space.reading", type="railroad", price=200, rent=25, group="railroad", group_key="group.railroad", mortgage=100),
    Space(name_key="space.oriental", type="property", price=100, rent=6, group="lightBlue", group_key="group.lightBlue", mortgage=50),
    Space(name_key="space.chance", type="chance"),
    Space(name_key="space.vermont", type="property", price=100, rent=6, group="lightBlue", group_key="group.lightBlue", mortgage=50),
    Space(name_key="space.connecticut", type="property", price=120, rent=8, group="lightBlue", group_key="group.lightBlue", mortgage=60),
    Space(name_key="space.jail", type="jail"),
    Space(name_key="space.stCharles", type="property", price=140, rent=10, group="pink", group_key="group.pink", mortgage=70),
    Space(name_key="space.electric", type="utility", price=150, rent=0, group="utility", group_key="group.utility", mortgage=75),
    Space(name_key="space.states", type="property", price=140, rent=10, group="pink", group_key="group.pink", mortgage=70),
    Space(name_key="space.virginia", type="property", price=160, rent=12, group="pink", group_key="group.pink", mortgage=80),
    Space(name_key="space.pennsylvaniaRR", type="railroad", price=200, rent=25, group="railroad", group_key="group.railroad", mortgage=100),
    Space(name_key="space.stJames", type="property", price=180, rent=14, group="orange", group_key="group.orange", mortgage=90),
    Space(name_key="space.chest2", type="chest"),
    Space(name_key="space.tennessee", type="property", price=180, rent=14, group="orange", group_key="group.orange", mortgage=90),
    Space(name_key="space.newYork", type="property", price=200, rent=16, group="orange", group_key="group.orange", mortgage=100),
    Space(name_key="space.freeParking", type="freeParking"),
    Space(name_key="space.kentucky", type="property", price=220, rent=18, group="red", group_key="group.red", mortgage=110),
    Space(name_key="space.chance2", type="chance"),
    Space(name_key="space.indiana", type="property", price=220, rent=18, group="red", group_key="group.red", mortgage=110),
    Space(name_key="space.illinois", type="property", price=240, rent=20, group="red", group_key="group.red", mortgage=120),
    Space(name_key="space.bAndO", type="railroad", price=200, rent=25, group="railroad", group_key="group.railroad", mortgage=100),
    Space(name_key="space.atlantic", type="property", price=260, rent=22, group="yellow", group_key="group.yellow", mortgage=130),
    Space(name_key="space.ventnor", type="property", price=260, rent=22, group="yellow", group_key="group.yellow", mortgage=130),
    Space(name_key="space.water", type="utility", price=150, rent=0, group="utility", group_key="group.utility", mortgage=75),
    Space(name_key="space.marvin", type="property", price=280, rent=24, group="yellow", group_key="group.yellow", mortgage=140),
    Space(name_key="space.goToJail", type="goToJail"),
    Space(name_key="space.pacific", type="property", price=300, rent=26, group="green", group_key="group.green", mortgage=150),
    Space(name_key="space.northCarolina", type="property", price=300, rent=26, group="green", group_key="group.green", mortgage=150),
    Space(name_key="space.chest3", type="chest"),
    Space(name_key="space.pennsylvania", type="property", price=320, rent=28, group="green", group_key="group.green", mortgage=160),
    Space(name_key="space.shortLine", type="railroad", price=200, rent=25, group="railroad", group_key="group.railroad", mortgage=100),
    Space(name_key="space.chance3", type="chance"),
    Space(name_key="space.parkPlace", type="property", price=350, rent=35, group="darkBlue", group_key="group.darkBlue", mortgage=175),
    Space(name_key="space.luxuryTax", type="tax", tax_amount=100),
    Space(name_key="space.boardwalk", type="property", price=400, rent=50, group="darkBlue", group_key="group.darkBlue", mortgage=200),
]