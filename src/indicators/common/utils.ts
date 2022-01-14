import { filter, round } from 'lodash'
import { OHLCBlock } from '../../common/interfaces/interfaces'
import moment from 'moment'
import { StochasticInput } from 'technicalindicators/declarations/momentum/Stochastic'

export const allNegatives = (values: number[]) => filter(values, (e) => e < 0).length == values.length

export const allPositives = (values: number[]) => filter(values, (e) => e > 0).length == values.length

export const getBlockMaturity = (interval: number, block?: OHLCBlock): number => {
  if(block) {
    const now = moment().unix()
    const age = now - block.time
    return round(age / (interval * 60), 2)
  }
  return 0
}

export const getMaturedBlocks = (interval: number, maturity: number, blocks: OHLCBlock[]) : OHLCBlock[] => {
  const now = moment().unix()
  const margin = (interval * 60) * maturity
  const threshold = now - margin
  return filter(blocks, o => o.time < threshold)
}

export const convertToStochasticInput = (blocks: OHLCBlock[]): StochasticInput => {
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
