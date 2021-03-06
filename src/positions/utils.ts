// import { round, filter, sortBy } from 'lodash'
// import { OpenBet } from './bet.interface'

// const deviation = (targetDeviation: number, position: OpenBet) => {
//   const deviation = position.price * targetDeviation / 2
//   return {
//     bottom: round(position.price - deviation, 10),
//     top: round(position.price + deviation, 10)
//   }
// }

// const not = (range: { top: number, bottom: number }) => (position: OpenBet) => {
//   return position.price > range.top || position.price < range.bottom
// }

// const is = (range: { top: number, bottom: number }) => (position: OpenBet) => {
//   return  position.price <= range.top && position.price >= range.bottom
// }

// export const average = (positions: OpenBet[]) => {
//   return positions.reduce((acc, position) => {
//     const costs = (acc.volume * acc.price) + (position.volume * position.price)
//     return {
//       pair: position.pair,
//       volume: acc.volume + position.volume,
//       price: costs / (acc.volume + position.volume)
//     }
//   }, { pair: '', price: 0, volume: 0 })
// }

// // TODO: improve this function
// /**
//  * Improve this function as it doesn't work in any case as it iterates over ALL initial positions.
//  * It doesn't take into account if a position was alreasy merged with another one.
//  * However, this doesn't seem to be a big issue because in that case, `inRange` will include this position explicitly (only as average)
//  * Better would be to to do it recusively
//  *
//  * @param targetDeviation deviation of the price in percent
//  * @param positions
//  */
// export const averaging = (targetDeviation: number, positions: OpenBet[]) => {
//   const sortedPositions = sortBy(positions, 'price')
//   return sortedPositions.reduce((acc, position) => {
//     const d = deviation(targetDeviation, position)
//     const notInRange = filter(acc, not(d))
//     const inRange = filter(acc, is(d))
//     const avg = average(inRange)
//     return [ avg, ...notInRange ]
//   }, sortedPositions)
// }
