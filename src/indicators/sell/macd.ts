import { takeRight } from 'lodash'
import { OHLCBlock } from '../../krakenService'
import { logger } from '../../common/logger'
import { allPositives } from '../common/utils'
import { round, every } from 'lodash'
import { calculateMACD, histogram, MACDResult, matured } from '../common/macdUtils'

// TODO: Signal Line still below Zero. Then we might not sell

// Returns true if last three data points swing from positive trend to a negative trend
export const isDownSwing = (macd: MACDResult) => {

  if(macd.blocks.length < 3) {
    throw Error('Not enough data')
  }

  // v0 oldest, v1 middel, v2 now
  const maturedBlocks = matured(macd)
  const histogramOfMaturedBlocks = histogram(maturedBlocks)
  const b = takeRight(histogramOfMaturedBlocks, 3).map(value => round(value, 6))
  const result = allPositives(b) && b[0] < b[1] && b[1] > b[2]

  logger.debug(`MACD SELL/HISTOGRAM: [${b[0]} | ${b[1]} | ${b[2]}] -> ${result}`)

  return result
}

// and sell—or short—the security when the MACD crosses below the signal line.
export const signal = () => {

}

export const indicator = (period: number, blockMaturity: number, head: OHLCBlock, blocks: OHLCBlock[]) => {
  const macd = calculateMACD(period, blockMaturity, blocks)
  return every([
    isDownSwing(macd),
  ], Boolean)
}
