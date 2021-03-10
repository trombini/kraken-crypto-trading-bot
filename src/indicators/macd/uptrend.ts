import { OHLCBlock } from '../../common/interfaces/trade.interface'
import { calculateMACD, getMaturedHistogram } from './utils'
import { logger } from '../../common/logger'
import { MACDResult } from './macd.interface'

export const uptrend = (period: number, requiredBlockMaturity: number) => (blocks: OHLCBlock[]): number => {
  const macd = calculateMACD(period, requiredBlockMaturity, blocks)
  return analyse(macd)
}

export const analyse = (macd: MACDResult): number => {
  if(macd.blocks.length < 3) {
    throw Error('Not enough data')
  }

  // v0 oldest, v1 middel, v2 now
  const b = getMaturedHistogram(macd, 3)
  const result = b[0] < b[1] && b[1] < b[2]
  const confidence = result ? 1 : 0

  logger.debug(`UPTREND: [ ${b[0]} | ${b[1]} | ${b[2]} ] -> ${confidence}`)

  return confidence
}
