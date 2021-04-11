import { inWinZoneByAmount, inWinZoneByPercentage } from './utils'

beforeEach(() => {

})

describe('Bot Utils', () => {

  describe('inWinZoneByAmount', () => {

    it('should fail because currentBidPrize not yet be in profit range for given position', () => {
      const result = inWinZoneByAmount(1000, 1, 1.05, 50, 0.0016)
      expect(result).toBe(false)
    })

    it('should succeed successful as currentPrize in profit range for given position', () => {
      const result = inWinZoneByAmount(1000, 1, 1.1, 50, 0.0016)
      expect(result).toBe(true)
    })

  })

  describe('inWinZoneByPercentage', () => {

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
