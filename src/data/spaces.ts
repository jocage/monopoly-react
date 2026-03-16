export type SpaceType = 'go' | 'property' | 'chest' | 'tax' | 'railroad' | 'chance' | 'jail' | 'utility' | 'freeParking' | 'goToJail'

export interface Space {
  nameKey: string
  type: SpaceType
  price?: number
  rent?: number
  group?: string
  groupKey?: string
  taxAmount?: number
  mortgage?: number
}

export const SPACES: Space[] = [
  { nameKey: 'space.go', type: 'go' },
  { nameKey: 'space.mediterranean', type: 'property', price: 60, rent: 2, group: 'brown', groupKey: 'group.brown', mortgage: 30 },
  { nameKey: 'space.chest', type: 'chest' },
  { nameKey: 'space.baltic', type: 'property', price: 60, rent: 4, group: 'brown', groupKey: 'group.brown', mortgage: 30 },
  { nameKey: 'space.incomeTax', type: 'tax', taxAmount: 200 },
  { nameKey: 'space.reading', type: 'railroad', price: 200, rent: 25, group: 'railroad', groupKey: 'group.railroad', mortgage: 100 },
  { nameKey: 'space.oriental', type: 'property', price: 100, rent: 6, group: 'lightBlue', groupKey: 'group.lightBlue', mortgage: 50 },
  { nameKey: 'space.chance', type: 'chance' },
  { nameKey: 'space.vermont', type: 'property', price: 100, rent: 6, group: 'lightBlue', groupKey: 'group.lightBlue', mortgage: 50 },
  { nameKey: 'space.connecticut', type: 'property', price: 120, rent: 8, group: 'lightBlue', groupKey: 'group.lightBlue', mortgage: 60 },
  { nameKey: 'space.jail', type: 'jail' },
  { nameKey: 'space.stCharles', type: 'property', price: 140, rent: 10, group: 'pink', groupKey: 'group.pink', mortgage: 70 },
  { nameKey: 'space.electric', type: 'utility', price: 150, rent: 0, group: 'utility', groupKey: 'group.utility', mortgage: 75 },
  { nameKey: 'space.states', type: 'property', price: 140, rent: 10, group: 'pink', groupKey: 'group.pink', mortgage: 70 },
  { nameKey: 'space.virginia', type: 'property', price: 160, rent: 12, group: 'pink', groupKey: 'group.pink', mortgage: 80 },
  { nameKey: 'space.pennsylvaniaRR', type: 'railroad', price: 200, rent: 25, group: 'railroad', groupKey: 'group.railroad', mortgage: 100 },
  { nameKey: 'space.stJames', type: 'property', price: 180, rent: 14, group: 'orange', groupKey: 'group.orange', mortgage: 90 },
  { nameKey: 'space.chest2', type: 'chest' },
  { nameKey: 'space.tennessee', type: 'property', price: 180, rent: 14, group: 'orange', groupKey: 'group.orange', mortgage: 90 },
  { nameKey: 'space.newYork', type: 'property', price: 200, rent: 16, group: 'orange', groupKey: 'group.orange', mortgage: 100 },
  { nameKey: 'space.freeParking', type: 'freeParking' },
  { nameKey: 'space.kentucky', type: 'property', price: 220, rent: 18, group: 'red', groupKey: 'group.red', mortgage: 110 },
  { nameKey: 'space.chance2', type: 'chance' },
  { nameKey: 'space.indiana', type: 'property', price: 220, rent: 18, group: 'red', groupKey: 'group.red', mortgage: 110 },
  { nameKey: 'space.illinois', type: 'property', price: 240, rent: 20, group: 'red', groupKey: 'group.red', mortgage: 120 },
  { nameKey: 'space.bAndO', type: 'railroad', price: 200, rent: 25, group: 'railroad', groupKey: 'group.railroad', mortgage: 100 },
  { nameKey: 'space.atlantic', type: 'property', price: 260, rent: 22, group: 'yellow', groupKey: 'group.yellow', mortgage: 130 },
  { nameKey: 'space.ventnor', type: 'property', price: 260, rent: 22, group: 'yellow', groupKey: 'group.yellow', mortgage: 130 },
  { nameKey: 'space.water', type: 'utility', price: 150, rent: 0, group: 'utility', groupKey: 'group.utility', mortgage: 75 },
  { nameKey: 'space.marvin', type: 'property', price: 280, rent: 24, group: 'yellow', groupKey: 'group.yellow', mortgage: 140 },
  { nameKey: 'space.goToJail', type: 'goToJail' },
  { nameKey: 'space.pacific', type: 'property', price: 300, rent: 26, group: 'green', groupKey: 'group.green', mortgage: 150 },
  { nameKey: 'space.northCarolina', type: 'property', price: 300, rent: 26, group: 'green', groupKey: 'group.green', mortgage: 150 },
  { nameKey: 'space.chest3', type: 'chest' },
  { nameKey: 'space.pennsylvania', type: 'property', price: 320, rent: 28, group: 'green', groupKey: 'group.green', mortgage: 160 },
  { nameKey: 'space.shortLine', type: 'railroad', price: 200, rent: 25, group: 'railroad', groupKey: 'group.railroad', mortgage: 100 },
  { nameKey: 'space.chance3', type: 'chance' },
  { nameKey: 'space.parkPlace', type: 'property', price: 350, rent: 35, group: 'darkBlue', groupKey: 'group.darkBlue', mortgage: 175 },
  { nameKey: 'space.luxuryTax', type: 'tax', taxAmount: 100 },
  { nameKey: 'space.boardwalk', type: 'property', price: 400, rent: 50, group: 'darkBlue', groupKey: 'group.darkBlue', mortgage: 200 },
]
