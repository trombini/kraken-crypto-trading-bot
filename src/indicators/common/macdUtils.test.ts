import moment from 'moment'
import { maturedBlocks } from './macdUtils'

describe('MACD utils', () => {

  it('should return all blocks as all are matured', () => {
    const result = maturedBlocks({
      period: 1,
      headMaturity: 0,
      isHeadMatured: true,
      blocks: [ { histogram: 1 }, { histogram: 1 },  { histogram: 1 } ]
    })

    expect(result.length).toBe(3)
  })

  it('should remove head as it did not yet mature', () => {
    const result = maturedBlocks({
      period: 1,
      headMaturity: 0,
      isHeadMatured: false,
      blocks: [ { histogram: 1 }, { histogram: 1 },  { histogram: 1 } ],
    })

    expect(result.length).toBe(2)
  })
})
