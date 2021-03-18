import { inWinZoneByPercentage } from './utils'

beforeEach(() => {

})

describe('Bot Utils', () => {

  describe('', () => {

    // TODO: fix test
    // it('should fail because position doesnt have a price set yet', () => {
    //   const invalidBet = new PositionModel({ buy: { volume: 1000 }})
    //   expect(() => {
    //     bot.inWinZone(1, 1, invalidBet)
    //   }).toThrow()
    // })

    // TODO: fix test
    // it('should fail because currentBidPrize not yet be in profit range for given position', () => {
    //   const highPricedBet = new PositionModel({ buy: { volume: 1000, price: 1 }})
    //   const currentBidPrize = 1.05
    //   const targetProfit = 50
    //   const result = bot.inWinZone(currentBidPrize, targetProfit, highPricedBet)
    //   expect(result).toBe(false)
    // })

    // TODO: fix test
    // it('should succeed successful as currentPrize in profit range for given position', () => {
    //   const validBet = new PositionModel({ buy: { volume: 1000, price: 1 }})
    //   const currentBidPrize = 1.1
    //   const targetProfit = 50
    //   const result = bot.inWinZone(currentBidPrize, targetProfit, validBet)
    //   expect(result).toBe(true)
    // })

  })

  describe('WinZone Percentage', () => {

    it('should return false as the position is not yet in the WIN zone', async () => {
      const result = inWinZoneByPercentage(1, 100, 102, 0.02, 0.0016)
      expect(result).toBe(false)
    })

    it('should return true as the position is stlighly in the WIN zone', async () => {
      const result = inWinZoneByPercentage(1, 100, 103, 0.02, 0.0016)
      expect(result).toBe(true)
    })

  })

})
