import { round, takeRight } from 'lodash'
import { Stochastic } from 'technicalindicators'
import { OHLCBlock } from '../../common/interfaces/trade.interface'
import { logger } from '../../common/logger'

const flattenOhlcInput = (blocks: OHLCBlock[]) => {
  const flatOhlcBlocks = blocks.reduce((acc, block) => {
    acc.high.push(block.high)
    acc.low.push(block.low)
    acc.close.push(block.close)
    return acc
  }, { high:[], low: [], close: [] } as {
    high: any[]
    low: any[]
    close: any[]
  })

  return {
    high: flatOhlcBlocks.high,
    low: flatOhlcBlocks.low,
    close: flatOhlcBlocks.close,
    period: 14,
    signalPeriod: 3
  }
}

// Stochastic Fast
export const stochastic = () => (blocks: OHLCBlock[]): number  => {
  const config = flattenOhlcInput(blocks)
  const stochf = Stochastic.calculate(config)
  const { k, d } = takeRight(stochf, 1)[0]

  let confidence = 0
  if(k > d) {
    confidence = 1
  }
  else if(k < d && (d - k) <= 2) {
    confidence = 0.8
  }
  else if(k < d && (d - k) <= 5) {
    confidence = 0.5
  }
  else {
    confidence = 0
  }

  logger.debug(`STOCHF: [ k: ${round(k, 2)} | d: ${round(d, 2)} ] -> ${confidence}`)
  return confidence
}
