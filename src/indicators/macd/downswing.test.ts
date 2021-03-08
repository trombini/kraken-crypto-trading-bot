import { MACDResult } from '../common/macdUtils'
import { analyse } from './downswing'

const mockMacdResult = (matured: boolean, values: number[]): MACDResult => {
  return {
    blocks: values.map(value => ({
      MACD: value,
      signal: value,
      histogram: value
    })),
    period: 1,
    headMaturity: 1,
    isHeadMatured: matured
  }
}

describe('MACD', () => {

  describe('downswing', () => {

    it(`should fail because we don't have enough data`, () => {
      const macd = mockMacdResult(true, [1, 2])
      expect(() => {
        analyse(macd)
      }).toThrow()
    })

    it('should be true because it a downswing', () => {
      const macd = mockMacdResult(true, [2,3,2])
      const result = analyse(macd)
      expect(result).toBe(1)
    })

    it('should be false because it is not YET a downswing (because of maturity)', () => {
      const macd = mockMacdResult(false, [2, 2, 3, 2])
      const result = analyse(macd)
      expect(result).toBe(0)
    })

  })

})


// const mockFunctions = () => {
//   const original = jest.requireActual('./utils')
//   return {
//     ...original,
//     calculateMACD: jest.fn((period: number, a: number, blocks) => {
//       return {
//         blocks: blocks.map(value => ({ histogram: value.close })),
//         period: period,
//         headMaturity: 1,
//         isHeadMatured: true
//       }
//     }),
//   }
// }

// jest.mock('./utils', () => mockFunctions())