import { filter, round } from 'lodash'
import { OhlcCandle } from 'src/krakenPlus/ohlc/ohlc'
import { StochasticInput } from 'technicalindicators/declarations/momentum/Stochastic'
import moment from 'moment'

export const allNegatives = (values: number[]) => filter(values, (e) => e < 0).length == values.length

export const allPositives = (values: number[]) => filter(values, (e) => e > 0).length == values.length

export const getBlockMaturity = (interval: number, block?: OhlcCandle): number => {
  if(block) {
    const now = moment().unix()
    const age = now - block.time
    return round(age / (interval * 60), 2)
  }
  return 0
}

export const getMaturedBlocks = (interval: number, maturity: number, blocks: OhlcCandle[]) : OhlcCandle[] => {
  const now = moment().unix()
  const margin = (interval * 60) * maturity
  const threshold = now - margin
  return filter(blocks, o => o.time < threshold)
}

export const convertToStochasticInput = (blocks: OhlcCandle[]): StochasticInput => {
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
