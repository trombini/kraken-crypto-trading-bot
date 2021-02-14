import { calculateExitStrategy } from './bot'
import { Trade } from './interfaces/trade.interface'

describe('BOT', () => {

  it('should calculate correct target price', () => {
    const expectedProfit = 50
    const trade: Trade = {
      id: 'someid',
      pair: 'adausd',
      price: 0.9,
      volume: 1000,
      cost: 10101010,
      fee: 0,
      tax: 0.0018
    }
    const sellOrder = calculateExitStrategy(expectedProfit, trade)

    expect(sellOrder.volume + expectedProfit).toBe(trade.volume)
    expect(sellOrder.price).toBeGreaterThan(trade.price)
    expect(sellOrder.volume).toBeLessThan(trade.volume)
    expect(sellOrder.price).toBe(0.951)
  })

})
