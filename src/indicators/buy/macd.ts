import { last, takeRight } from 'lodash'
import { OHLCBlock } from '../../krakenService'
import { logger } from '../../common/logger'
import { allNegatives } from '../common/utils'
import { MACDOutput } from 'technicalindicators/declarations/moving_averages/MACD'
import { round, every } from 'lodash'
import { calculateMACD, histogram, MACDResult, matured } from '../common/macdUtils'

// TODO: check if sell period was long and strong enough. Don't just buy because three blocks were in the reds.

// Returns true if last three data points swing from netgative trend to a positive trend
export const isUpSwing = (macd: MACDResult) => {

  if(macd.blocks.length < 3) {
    throw Error('Not enough data')
  }

  // v0 oldest, v1 middel, v2 now
  const maturedBlocks = matured(macd)
  const histogramOfMaturedBlocks = histogram(maturedBlocks)
  const b = takeRight(histogramOfMaturedBlocks, 3).map(value => round(value, 6))
  const result = allNegatives(b) && b[0] > b[1] && b[1] < b[2]

  logger.debug(`MACD BUY/HISTOGRAM: [${b[0]} | ${b[1]} | ${b[2]}] -> ${result}`)

  return result
}

export const isStrongSignal = (macd: MACDResult) => {
  const sum = round(takeRight(macd.blocks, 10).reduce((acc, macd, index) => {
    return acc + (macd.histogram ? macd.histogram : 0)
  }, 0), 3)

  logger.debug(`MACD BUY/HISTOGRAM/STRENGTH: [${ sum * -1 }] -> ${true}`)

  return true
}

// Traders may buy the asset when the MACD crosses above its signal line
export const macdCrossesAboveSignal = (macd: MACDResult) => {
  const head = last(matured(macd))
  if (head && head.signal && head?.MACD) {
    const macdAboveSignal = head.MACD > head.signal
    const macdBelowZero = head.MACD < 0
    const delta = head.MACD - head.signal
    logger.debug(`MACD BUY/MACD: [${round(head.MACD, 4)} | ${round(head.signal, 4)} | ${delta}] -> ${macdAboveSignal}`)

    return macdBelowZero && macdAboveSignal
  }
  return false
}

export const indicator = (period: number, blockMaturity: number, head: OHLCBlock, blocks: OHLCBlock[]) => {
  const macd = calculateMACD(period, blockMaturity, blocks)
  return every([
    isStrongSignal(macd),
    isUpSwing(macd),
    macdCrossesAboveSignal(macd)
  ], Boolean)
}
