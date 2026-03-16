export interface Card {
  textKey: string
  action: (ctx: CardContext) => void
}

export interface CardContext {
  playerIndex: number
  moveTo: (pos: number) => void
  moveBy: (delta: number) => void
  addMoney: (amount: number) => void
  goToJail: () => void
  collectFromAll: (amount: number) => void
  payToAll: (amount: number) => void
}

export const CHANCE_CARDS: Card[] = [
  { textKey: 'card.advanceGo', action: (c) => c.moveTo(0) },
  { textKey: 'card.bankDividend', action: (c) => c.addMoney(50) },
  { textKey: 'card.goBack3', action: (c) => c.moveBy(-3) },
  { textKey: 'card.goJail', action: (c) => c.goToJail() },
  { textKey: 'card.repairs', action: (c) => c.addMoney(-25) },
  { textKey: 'card.poorTax', action: (c) => c.addMoney(-15) },
  { textKey: 'card.tripReading', action: (c) => c.moveTo(5) },
  { textKey: 'card.boardwalk', action: (c) => c.moveTo(39) },
  { textKey: 'card.chairman', action: (c) => c.payToAll(50) },
  { textKey: 'card.buildingLoan', action: (c) => c.addMoney(150) },
]

export const CHEST_CARDS: Card[] = [
  { textKey: 'card.bankError', action: (c) => c.addMoney(200) },
  { textKey: 'card.doctorFee', action: (c) => c.addMoney(-50) },
  { textKey: 'card.saleStock', action: (c) => c.addMoney(50) },
  { textKey: 'card.goGo', action: (c) => c.moveTo(0) },
  { textKey: 'card.operaNight', action: (c) => c.collectFromAll(50) },
  { textKey: 'card.holiday', action: (c) => c.addMoney(100) },
  { textKey: 'card.incomeTaxRefund', action: (c) => c.addMoney(20) },
  { textKey: 'card.birthday', action: (c) => c.collectFromAll(10) },
  { textKey: 'card.lifeInsurance', action: (c) => c.addMoney(100) },
  { textKey: 'card.hospitalFee', action: (c) => c.addMoney(-100) },
  { textKey: 'card.schoolFee', action: (c) => c.addMoney(-50) },
  { textKey: 'card.consultancyFee', action: (c) => c.addMoney(25) },
  { textKey: 'card.streetRepairs', action: (c) => c.addMoney(-40) },
  { textKey: 'card.beautyContest', action: (c) => c.addMoney(10) },
  { textKey: 'card.inherit', action: (c) => c.addMoney(100) },
]
