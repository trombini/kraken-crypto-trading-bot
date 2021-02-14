import moment from 'moment'
import { allNegatives, getMaturedBlocks, isUpSwing, isUpTrend } from './macdIndicator'

describe('MACD', () => {

  describe('', () => {

    it('should succeed if all numbers are negative', () => {
      expect(allNegatives([-1, -3, -10231])).toBe(true)
    })

    it('should return now blocks which are not matured', () => {
      const maturity = 0.75
      const interval = 5
      const blocks = [2, 1, 0.5].map(blockAge => {
        return {
          time: moment().subtract(blockAge * interval, 'm').unix(),
          close: 1
        }
      })

      const result = getMaturedBlocks(interval, maturity, blocks)
      expect(result.length).toBe(2)
    })

    it('should return now blocks which are not matured', () => {
      const maturity = 0.75
      const interval = 5
      const blocks = [2, 1, 0.99].map(blockAge => {
        return {
          time: moment().subtract(blockAge * interval, 'm').unix(),
          close: 1
        }
      })

      const result = getMaturedBlocks(interval, maturity, blocks)
      expect(result.length).toBe(3)
    })
  })

  describe('isUpTrend', () => {

    it('should fail because not enough data', () => {
      const input = [-3, -2]
      expect(() => {
        isUpTrend(input)()
      }).toThrow()
    })

    it('should be false because down trend', () => {
      const input = [-1, -2, -3]
      expect(isUpTrend(input)()).toBe(false)
    })

    it('should be true because up trend', () => {
      const input = [-3, -2, -1]
      expect(isUpTrend(input)()).toBe(true)
    })

    it('should be true because up trend', () => {
      const input = [1, 2, 3]
      expect(isUpTrend(input)()).toBe(true)
    })
  })

  describe('isUpSwing', () => {

    it('should fail because not enough data', () => {
      const input = [-3, -2]
      expect(() => {
        isUpSwing(input)()
      }).toThrow()
    })

    it('should be false because it is a down trend', () => {
      const input = [-1, -2, -3]
      expect(isUpSwing(input)()).toBe(false)
    })

    it('should be false because it is an up trend, upswing is over', () => {
      const input = [-3, -2, -1]
      expect(isUpSwing(input)()).toBe(false)
    })

    it('should be false because it is already positive', () => {
      const input = [-1, 1, 2]
      expect(isUpSwing(input)()).toBe(false)
    })

    it('should be false because history is flat', () => {
      const input = [-2, -2, -1]
      expect(isUpSwing(input)()).toBe(false)
    })

    it('should be true because up swing', () => {
      const input = [-2, -3, -1]
      expect(isUpSwing(input)()).toBe(true)
    })
  })

})
