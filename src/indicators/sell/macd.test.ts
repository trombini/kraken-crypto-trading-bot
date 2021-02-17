import { isDownSwing } from './macd'

describe('MACD / Sell', () => {

  describe('isUpSwing', () => {

    it('should fail because not enough data', () => {
      const input = [1, 2]
      expect(() => {
        isDownSwing(input)
      }).toThrow()
    })

    it('should be false because it is a up trend', () => {
      const input = [1, 2, 3]
      expect(isDownSwing(input)).toBe(false)
    })

    it('should be false because it is a down trend, downswing is over', () => {
      const input = [3, 2, 1]
      expect(isDownSwing(input)).toBe(false)
    })

    it('should be false because it is already negative', () => {
      const input = [2, 1, -1]
      expect(isDownSwing(input)).toBe(false)
    })

    // TODO: does this make sense as an indicator??
    it('should be false because history is flat', () => {
      const input = [2, 2, 1]
      expect(isDownSwing(input)).toBe(false)
    })

    it('should be true because up swing', () => {
      const input = [1, 2, 1]
      expect(isDownSwing(input)).toBe(true)
    })
  })

})
