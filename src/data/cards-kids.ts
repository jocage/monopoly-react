import type { Card } from './cards'

// Simpler cards for kids: small money amounts, no complex mechanics
export const KIDS_CHANCE_CARDS: Card[] = [
  { textKey: 'kids.card.findCoin', action: (c) => c.addMoney(2) },
  { textKey: 'kids.card.lemonade', action: (c) => c.addMoney(3) },
  { textKey: 'kids.card.skipForward', action: (c) => c.moveBy(2) },
  { textKey: 'kids.card.goBack', action: (c) => c.moveBy(-2) },
  { textKey: 'kids.card.birthdayGift', action: (c) => c.collectFromAll(1) },
  { textKey: 'kids.card.advanceGo', action: (c) => c.moveTo(0) },
  { textKey: 'kids.card.iceCreamTreat', action: (c) => c.addMoney(-1) },
  { textKey: 'kids.card.helpNeighbor', action: (c) => c.addMoney(2) },
]

export const KIDS_CHEST_CARDS: Card[] = [
  { textKey: 'kids.card.piggyBank', action: (c) => c.addMoney(3) },
  { textKey: 'kids.card.lostToy', action: (c) => c.addMoney(-1) },
  { textKey: 'kids.card.goodGrades', action: (c) => c.addMoney(2) },
  { textKey: 'kids.card.chores', action: (c) => c.addMoney(2) },
  { textKey: 'kids.card.brokeVase', action: (c) => c.addMoney(-2) },
  { textKey: 'kids.card.toothFairy', action: (c) => c.addMoney(1) },
  { textKey: 'kids.card.shareSnack', action: (c) => c.payToAll(1) },
  { textKey: 'kids.card.pennyJar', action: (c) => c.addMoney(1) },
]
