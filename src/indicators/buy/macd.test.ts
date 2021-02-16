import moment from 'moment'
import { isUpSwing, isUpTrend } from './macd'

describe('MACD / Buy', () => {

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
