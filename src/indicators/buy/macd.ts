import { last, takeRight } from 'lodash'
import { OHLCBlock } from '../../common/interfaces/trade.interface'
import { logger } from '../../common/logger'
import { allNegatives } from '../common/utils'
import { round, every } from 'lodash'
import { calculateMACD, histogram, MACDResult, maturedBlocks } from '../common/macdUtils'

// TODO: check if sell period was long and strong enough. Don't just buy because three blocks were in the reds.

// Returns true if last three data points swing from netgative trend to a positive trend
export const isUpSwing = (macd: MACDResult): Boolean => {

  if(macd.blocks.length < 3) {
    throw Error('Not enough data')
  }

  // v0 oldest, v1 middel, v2 now
  const matured = maturedBlocks(macd)
  const maturedTopBlocks = takeRight(matured, 3)
  const histogramOfMaturedBlocks = histogram(maturedTopBlocks)
  const b = histogramOfMaturedBlocks.map(value => round(value, 6))
  const result = allNegatives(b) && b[0] > b[1] && b[1] < b[2]

  logger.debug(`MACD BUY/HISTOGRAM: [${b[0]} | ${b[1]} | ${b[2]}] -> ${result}`)

  return result
}

export const isStrongSignal = (macd: MACDResult) => {
  const sum = takeRight(macd.blocks, 12)
    .map(block => block.histogram || 0)
    .filter(historgram => historgram && historgram < 0)
    .reduce((acc, value) => acc - value, 0)

  const result = sum > 0.004

  logger.debug(`MACD BUY/HISTOGRAM/STRENGTH: [${ round(sum, 5) }] -> ${result}`)

  //return true
  return result
}

// Traders may buy the asset when the MACD crosses above its signal line
export const macdCrossesAboveSignal = (macd: MACDResult) => {
  const head = last(maturedBlocks(macd))
  if (head && head.signal && head?.MACD) {
    const macdAboveSignal = head.MACD > head.signal
    const macdBelowZero = head.MACD < 0
    const delta = head.MACD - head.signal
    logger.debug(`MACD BUY/MACD: [${round(head.MACD, 4)} | ${round(head.signal, 4)} | ${round(delta, 4)}] -> ${macdAboveSignal}`)

    return true
    return macdBelowZero && macdAboveSignal
  }
  return true
}

export const indicator = (period: number, blockMaturity: number, head: OHLCBlock, blocks: OHLCBlock[]) => {
  const macd = calculateMACD(period, blockMaturity, blocks)
  return every([
    isUpSwing(macd),
    isStrongSignal(macd),
    macdCrossesAboveSignal(macd)
  ], Boolean)
}
