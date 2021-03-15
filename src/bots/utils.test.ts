import PositionModel from '../positions/position.model'
import { inWinZone } from './utils'

beforeEach(() => {

})

describe('FullProfitBot', () => {

  it('should fallback to zero if available amount is less than 1000 $', async () => {
    const position = new PositionModel({ buy: { volume: 100, price: 1850 }})
    const result = inWinZone(position, 1850, 0.01, 0.0016)
    expect(result).toBe(false)
  })
})
