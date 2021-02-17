import { isUpSwing, isUpTrend } from './macd'

describe('MACD / Buy', () => {

  describe('isUpTrend', () => {

    it('should fail because not enough data', () => {
      const input = [-3, -2]
      expect(() => {
        isUpTrend(input)
      }).toThrow()
    })

    it('should be false because down trend', () => {
      const input = [-1, -2, -3]
      expect(isUpTrend(input)).toBe(false)
    })

    it('should be true because up trend', () => {
      const input = [-3, -2, -1]
      expect(isUpTrend(input)).toBe(true)
    })

    it('should be true because up trend', () => {
      const input = [1, 2, 3]
      expect(isUpTrend(input)).toBe(true)
    })
  })

  describe('isUpSwing', () => {

    it('should fail because not enough data', () => {
      const input = [-3, -2]
      expect(() => {
        isUpSwing(input)
      }).toThrow()
    })

    it('should be false because it is a down trend', () => {
      const input = [-1, -2, -3]
      expect(isUpSwing(input)).toBe(false)
    })

    it('should be false because it is an up trend, upswing is over', () => {
      const input = [-3, -2, -1]
      expect(isUpSwing(input)).toBe(false)
    })

    it('should be false because it is already positive', () => {
      const input = [-1, 1, 2]
      expect(isUpSwing(input)).toBe(false)
    })

    it('should be false because history is flat', () => {
      const input = [-2, -2, -1]
      expect(isUpSwing(input)).toBe(false)
    })

    it('should be true because up swing', () => {
      const input = [-2, -3, -1]
      expect(isUpSwing(input)).toBe(true)
    })
  })

})


// UPSWING??

// 2021-02-16T07:56:06.349Z [debug] Head Block Maturity: 0.74. Needs to be above 0.75.
// 2021-02-16T07:56:06.349Z [debug] MACD // isUpswing: -0.0012221514570677986 | -0.0016832052687486946 | -0.001487754135497297 -> true
// 2021-02-16T07:56:06.349Z [info] UPSWING detected for [ADAUSD]
// 2021-02-16T07:56:06.349Z [info] Won't buy ADAUSD as we just bought it.

