import { takeRight } from 'lodash'
import { OHLCBlock } from '../../krakenService'
import { logger } from '../../common/logger'
import { allPositives } from '../utils'
import { round, every } from 'lodash'
import { calculateMACD } from '../macd'

// TODO: Signal Line still below Zero. Then we might not sell

// Returns true if last three data points swing from positive trend to a negative trend
export const isDownSwing = (historgram: number[]) => {
  if(historgram.length < 3) {
    throw new Error('Not enough data points')
  }

  // v0 oldest, v1 middel, v2 now
  const v = takeRight(historgram, 3).map(v => round(v, 6))
  const result = allPositives(v) && v[0] < v[1] && v[1] > v[2]

  logger.debug(`MACD SELL/HISTOGRAM: [${v[0]} | ${v[1]} | ${v[2]}] -> ${result}`)

  return result
}

// and sell—or short—the security when the MACD crosses below the signal line.
export const signal = () => {

}

export const indicator = (period: number, blockMaturity: number, head: OHLCBlock, blocks: OHLCBlock[]) => {
  const macdOutput = calculateMACD(period, blockMaturity, head, blocks)
  const historgram = macdOutput.map(e => e.histogram || 0)
  return every([
    isDownSwing(historgram),
  ], Boolean)
}
