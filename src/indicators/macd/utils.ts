import { OHLCBlock } from '../../common/interfaces/trade.interface'
import { getBlockMaturity } from '../common/utils'
import { MACD } from 'technicalindicators'
import { last, clone, takeRight, round } from 'lodash'
import { MACDResult } from './macd.interface'

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
