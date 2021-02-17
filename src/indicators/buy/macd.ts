import { last, takeRight } from 'lodash'
import { OHLCBlock } from '../../krakenService'
import { logger } from '../../common/logger'
import { allNegatives } from '../utils'
import { MACDOutput } from 'technicalindicators/declarations/moving_averages/MACD'
import { round, every } from 'lodash'
import { calculateMACD } from '../macd'

// TODO: check if sell period was long and strong enough. Don't just buy because three blocks were in the reds.

// Returns true if last three data points swing from netgative trend to a positive trend
export const isUpSwing = (historgram: number[]) => {
  if(historgram.length < 3) {
    throw new Error('Not enough data points')
  }

  // v0 oldest, v1 middel, v2 now
  const v = takeRight(historgram, 3).map(v => round(v, 6))
  const result = allNegatives(v) && v[0] > v[1] && v[1] < v[2]

  logger.debug(`MACD BUY/HISTOGRAM: [${v[0]} | ${v[1]} | ${v[2]}] -> ${result}`)

  return result
}

// Returns true if last three data points lead to up trend
export const isUpTrend = (historgram: number[]) => {
  if(historgram.length < 3) {
    throw new Error('Not enough data points')
  }

  // v0 oldest, v1 middel, v2 now
  const v = takeRight(historgram, 3)
  return v[0] < v[1] && v[1] < v[2]
}

// Traders may buy the asset when the MACD crosses above its signal line
export const macdCrossesAboveSignal = (macdInput: MACDOutput[]) => {
  const head = last(macdInput)
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
  const macdOutput = calculateMACD(period, blockMaturity, head, blocks)
  const historgram = macdOutput.map(e => e.histogram || 0)
  return every([
    isUpSwing(historgram),
    macdCrossesAboveSignal(macdOutput)
  ], Boolean)
}
