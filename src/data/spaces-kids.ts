import type { Space } from './spaces'

// Kids board: 20 spaces on a 6×6 grid perimeter
// Fun, kid-friendly locations with emojis
export const KIDS_SPACES: Space[] = [
  { nameKey: 'kids.space.go', type: 'go' },
  { nameKey: 'kids.space.iceCream', type: 'property', price: 1, rent: 1, group: 'pink', groupKey: 'group.pink' },
  { nameKey: 'kids.space.chance', type: 'chance' },
  { nameKey: 'kids.space.toyStore', type: 'property', price: 2, rent: 1, group: 'pink', groupKey: 'group.pink' },
  { nameKey: 'kids.space.petShop', type: 'property', price: 2, rent: 1, group: 'lightBlue', groupKey: 'group.lightBlue' },
  { nameKey: 'kids.space.nap', type: 'jail' },
  { nameKey: 'kids.space.playground', type: 'property', price: 3, rent: 2, group: 'lightBlue', groupKey: 'group.lightBlue' },
  { nameKey: 'kids.space.chest', type: 'chest' },
  { nameKey: 'kids.space.candyShop', type: 'property', price: 3, rent: 2, group: 'orange', groupKey: 'group.orange' },
  { nameKey: 'kids.space.aquarium', type: 'property', price: 3, rent: 2, group: 'orange', groupKey: 'group.orange' },
  { nameKey: 'kids.space.freeParking', type: 'freeParking' },
  { nameKey: 'kids.space.zoo', type: 'property', price: 4, rent: 2, group: 'green', groupKey: 'group.green' },
  { nameKey: 'kids.space.chance2', type: 'chance' },
  { nameKey: 'kids.space.waterPark', type: 'property', price: 4, rent: 3, group: 'green', groupKey: 'group.green' },
  { nameKey: 'kids.space.movieTheater', type: 'property', price: 4, rent: 3, group: 'yellow', groupKey: 'group.yellow' },
  { nameKey: 'kids.space.goToNap', type: 'goToJail' },
  { nameKey: 'kids.space.circus', type: 'property', price: 4, rent: 3, group: 'yellow', groupKey: 'group.yellow' },
  { nameKey: 'kids.space.chest2', type: 'chest' },
  { nameKey: 'kids.space.amusementPark', type: 'property', price: 5, rent: 3, group: 'red', groupKey: 'group.red' },
  { nameKey: 'kids.space.castle', type: 'property', price: 5, rent: 4, group: 'red', groupKey: 'group.red' },
]

export const KIDS_GROUP_SIZES: Record<string, number> = {
  pink: 2,
  lightBlue: 2,
  orange: 2,
  green: 2,
  yellow: 2,
  red: 2,
}
