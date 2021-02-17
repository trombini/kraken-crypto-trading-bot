import { MACDOutput } from 'technicalindicators/declarations/moving_averages/MACD'
import { isDownSwing } from './macd'

const getFakeHistogram = (values: number[]): MACDOutput[] => {
  return values.map(value => {
    return {
      histogram: value
    }
  })
}

describe('MACD / Sell', () => {

  describe('isUpSwing', () => {

    it('should fail because not enough data', () => {
      expect(() => {
        isDownSwing({
          isHeadMatured: true,
          blocks: getFakeHistogram([1, 2]),
        })
      }).toThrow()
    })

    it('should be false because it is a up trend', () => {
      expect(isDownSwing({
        isHeadMatured: true,
        blocks: getFakeHistogram([1, 2, 3]),
      })).toBe(false)
    })

    it('should be false because it is a down trend, downswing is over', () => {
      expect(isDownSwing({
        isHeadMatured: true,
        blocks: getFakeHistogram([3, 2, 1]),
      })).toBe(false)
    })

    it('should be false because it is already negative', () => {
      expect(isDownSwing({
        isHeadMatured: true,
        blocks: getFakeHistogram([2, 1, -1]),
      })).toBe(false)
    })

    // TODO: does this make sense as an indicator??
    it('should be false because history is flat', () => {
      expect(isDownSwing({
        isHeadMatured: true,
        blocks: getFakeHistogram([2, 2, 1]),
      })).toBe(false)
    })

    it('should be true because we are in a down swing', () => {
      expect(isDownSwing({
        isHeadMatured: true,
        blocks: getFakeHistogram([1, 2, 1]),
      })).toBe(true)
    })
  })

})
