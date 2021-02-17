import { MACDOutput } from 'technicalindicators/declarations/moving_averages/MACD'
import { isUpSwing } from './macd'

const getFakeHistogram = (values: number[]): MACDOutput[] => {
  return values.map(value => {
    return {
      histogram: value
    }
  })
}

describe('MACD / Buy', () => {

  describe('isUpSwing', () => {

    it('should fail because not enough data', () => {
      expect(() => {
        isUpSwing({
          isHeadMatured: true,
          blocks: getFakeHistogram([-3, -2]),
        })
      }).toThrow()
    })

    it('should be false because it is a down trend', () => {
      expect(isUpSwing({
        isHeadMatured: true,
        blocks: getFakeHistogram([-1, -2, -3]),
      })).toBe(false)
    })

    it('should be false because it is an up trend, upswing is over', () => {
      expect(isUpSwing({
        isHeadMatured: true,
        blocks: getFakeHistogram([-3, -2, -1]),
      })).toBe(false)
    })

    it('should be false because it is already positive', () => {
      expect(isUpSwing({
        isHeadMatured: true,
        blocks: getFakeHistogram([-1, 1, 2]),
      })).toBe(false)
    })

    it('should be false because history is flat', () => {
      expect(isUpSwing({
        isHeadMatured: true,
        blocks: getFakeHistogram([-2, -2, -1]),
      })).toBe(false)
    })

    it('should be true because up swing', () => {
      expect(isUpSwing({
        isHeadMatured: true,
        blocks: getFakeHistogram([-2, -3, -1]),
      })).toBe(true)
    })
  })

})


// UPSWING??

// 2021-02-16T07:56:06.349Z [debug] Head Block Maturity: 0.74. Needs to be above 0.75.
// 2021-02-16T07:56:06.349Z [debug] MACD // isUpswing: -0.0012221514570677986 | -0.0016832052687486946 | -0.001487754135497297 -> true
// 2021-02-16T07:56:06.349Z [info] UPSWING detected for [ADAUSD]
// 2021-02-16T07:56:06.349Z [info] Won't buy ADAUSD as we just bought it.

