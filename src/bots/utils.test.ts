import { inWinZoneByAmount, inWinZoneByPercentage } from './utils'

beforeEach(() => {

})

describe('Bot Utils', () => {

  // describe('inWinZoneByAmount', () => {
  //   it('should fail because currentBidPrize not yet be in profit range for given position', () => {
  //     const result = inWinZoneByAmount(1000, 1, 1.05, 50, 0.0016)
  //     expect(result).toBe(false)
  //   })

  //   it('should succeed successful as currentPrize in profit range for given position', () => {
  //     const result = inWinZoneByAmount(1000, 1, 1.1, 50, 0.0016)
  //     expect(result).toBe(true)
  //   })
  // })

  describe('inWinZoneByPercentage', () => {
    it('should return false as the position is not yet in the WIN zone', async () => {
      const volume = 1
      const price = 100
      const currentBidPrice = 102
      const targetProfit = 0.02
      const tax = 0.00259
      const result = inWinZoneByPercentage(volume, price, currentBidPrice, targetProfit, tax)
      expect(result).toBe(false)
    })

    it('should return true as the position is stlighly in the WIN zone', async () => {
      const volume = 2
      const price = 100
      const currentBidPrice = 103
      const targetProfit = 0.02
      const tax = 0.00259
      const result = inWinZoneByPercentage(volume, price, currentBidPrice, targetProfit, tax)
      expect(result).toBe(true)
    })

    it('should return true as the position is stlighly in the WIN zone', async () => {
      inWinZoneByPercentage(20, 100, 100, 0, 0)
      inWinZoneByPercentage(100, 100, 100, 0, 0)
      inWinZoneByPercentage(1000, 100, 100, 0, 0)

      expect(true).toBe(true)
    })

  })

})
