import { OHLCBlock } from '../../common/interfaces/interfaces'
import { getBlockMaturity } from './utils'
import { MACD } from 'technicalindicators'
import { MACDOutput } from 'technicalindicators/declarations/moving_averages/MACD'
import { last, clone, takeRight, round } from 'lodash'

export interface MACDResult {
  blocks: MACDOutput[],
  period: number,
  headMaturity: number,
  isHeadMatured: boolean
}

// export const histogram = (macd: MACDOutput[]): number[] =>
//   macd.map(m => m.histogram ? m.histogram : 0)

export const maturedBlocks = (input: MACDResult) => {
  const blocks = clone(input.blocks)
  return input.isHeadMatured
    ? blocks
    : blocks.splice(0, blocks.length - 1)
}

export const getMaturedHistogram = (macd: MACDResult, size: number) => {
  const matured = maturedBlocks(macd)
  return takeRight(matured, size)
    .map(block => block.histogram || 0)
    .map(histogram => round(histogram, 6))
}

export const calculateMACD = (period: number, requiredBlockMaturity: number, blocks: OHLCBlock[]): MACDResult => {
  const macd = MACD.calculate({
    values: blocks.map(b => b.close),
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })

  const head = last(blocks)
  const headMaturity = getBlockMaturity(period, head)
  const isHeadMatured = headMaturity >= requiredBlockMaturity

  if(!isHeadMatured) {
    //logger.debug(`MACD: Block maturity for period '${period}' is '${headMaturity}'. Needs to be above ${requiredBlockMaturity}.`)
  }

  return {
    blocks: macd,
    isHeadMatured,
    headMaturity,
    period,
  }
}
