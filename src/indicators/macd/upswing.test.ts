import { MACDResult } from '../common/macdUtils'
import { analyse } from './upswing'

// TODO: move to test utils
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

describe('MACD Upswing', () => {

  it(`should fail because we don't have enough data`, () => {
    const macd = mockMacdResult(true, [1, 2])
    expect(() => {
      analyse(macd)
    }).toThrow()
  })

  it('should fail because it is still a downtrend', () => {
    const macd = mockMacdResult(true, [-1, -2, -3])
    const result = analyse(macd)
    expect(result).toBe(0)
  })

  it('should be false because it is an uptrend, upswing is over', () => {
    const macd = mockMacdResult(true, [-2, -3, -2, -1])
    const result = analyse(macd)
    expect(result).toBe(0)
  })

  it('should be false because it is already in positive', () => {
    const macd = mockMacdResult(true, [-2, -3, 1])
    const result = analyse(macd)
    expect(result).toBe(0)
  })

  it('should succeed because it an upswing', () => {
    const macd = mockMacdResult(true, [-2, -3, -2])
    const result = analyse(macd)
    expect(result).toBe(1)
  })

  it('should fail because it is not YET a downswing (because of maturity)', () => {
    const macd = mockMacdResult(false, [-2, -2, -3, -2])
    const result = analyse(macd)
    expect(result).toBe(0)
  })

})
