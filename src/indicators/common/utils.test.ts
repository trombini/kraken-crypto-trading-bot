import moment from 'moment'
import { allNegatives, getMaturedBlocks } from './utils'

describe('Indicator Utils', () => {
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
