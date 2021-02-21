import { Position } from './position.interface'
import { average, averaging } from './utils'

const calculateCosts = (positions: Position[]) =>
  positions.reduce((acc, pos) => acc + pos.price * pos.volume, 0)

describe('Reduce Positions', () => {

  it('should sum up all if deviation is 100%', () => {
    const positions = [
      { id: '1', pair:'a', price: 100, volume: 1000 },
      { id: '2', pair:'b', price: 200, volume: 2000 },
      { id: '3', pair:'c', price: 300, volume: 3000 },
      { id: '4', pair:'d', price: 400, volume: 4000 }
    ]

    const reduced = averaging(1.0, positions)
    const originalCosts = calculateCosts(positions)
    const resultingCosts = calculateCosts(reduced)

    expect(reduced.length).toEqual(1)
    expect(reduced[0].volume).toEqual(10000)
    expect(originalCosts).toEqual(resultingCosts)
  })

  it('should sum up correctly', () => {
    const positions = [
      { id: '1', pair:'a', price: 100, volume: 1000 },
      { id: '2', pair:'b', price: 102, volume: 1000 },
      { id: '3', pair:'c', price: 98, volume: 1000 },
      { id: '4', pair:'d', price: 200, volume: 4000 }
    ]

    const reduced = averaging(0.1, positions)
    const originalCosts = calculateCosts(positions)
    const resultingCosts = calculateCosts(reduced)

    expect(reduced.length).toEqual(2)
    expect(originalCosts).toEqual(resultingCosts)
  })

  it('should sum up correctly', () => {
    const positions = [
      { id: '1', pair:'a', price: 105, volume: 1000 },
      { id: '2', pair:'b', price: 100, volume: 1000 },
      { id: '3', pair:'c', price: 95, volume: 1000 },
    ]

    const reduced = averaging(0.1, positions)
    const originalCosts = calculateCosts(positions)
    const resultingCosts = calculateCosts(reduced)

    expect(reduced.length).toEqual(1)
    expect(reduced[0].price).toEqual(100)
    expect(originalCosts).toEqual(resultingCosts)
  })

  it('should calculate correct average over positions', () => {
    const positions = [
      { id: '1', pair:'a', price: 105, volume: 1000 },
      { id: '2', pair:'b', price: 100, volume: 1000 },
      { id: '3', pair:'c', price: 95, volume: 1000 },
    ]

    const avg = average(positions)
    expect(avg).toEqual(expect.objectContaining({
      volume: 3000, price: 100
    }))
  })
})
