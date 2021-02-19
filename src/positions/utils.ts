import { round, filter, sortBy } from 'lodash'
import { Position } from '../interfaces/trade.interface'

const deviation = (targetDeviation: number, position: Position) => {
  const deviation = position.price * targetDeviation / 2
  return {
    bottom: round(position.price - deviation, 10),
    top: round(position.price + deviation, 10)
  }
}

const not = (range: { top: number, bottom: number }) => (position: Position) => {
  return position.price > range.top || position.price < range.bottom
}

const is = (range: { top: number, bottom: number }) => (position: Position) => {
  return  position.price <= range.top && position.price >= range.bottom
}

export const average = (positions: Position[]) => {
  return positions.reduce((acc, position) => {
    const costs = (acc.volume * acc.price) + (position.volume * position.price)
    return {
      id: position.id,
      pair: position.pair,
      volume: acc.volume + position.volume,
      price: costs / (acc.volume + position.volume)
    }
  }, { id: 0, pair: 'x', price: 0, volume: 0 })
}

export const reduce = (targetDeviation: number, positions: Position[]) => {
  const sortedPositions = sortBy(positions, 'price')
  return sortedPositions.reduce((positions, position) => {
    const d = deviation(targetDeviation, position)
    const notInRange = filter(positions, not(d))
    const inRange = filter(positions, is(d))
    const avg = average(inRange)
    return [ avg, ...notInRange ]
  }, positions)
}
