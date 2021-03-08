import { OHLCBlock } from '../../common/interfaces/trade.interface'
import { logger } from '../../common/logger'
import { allPositives } from '../common/utils'
import { MACDResult } from './macd.interface'
import { calculateMACD, getMaturedHistogram } from './utils'

export const downswing = (period: number, requiredBlockMaturity: number) => (blocks: OHLCBlock[]): number => {
  const macd = calculateMACD(period, requiredBlockMaturity, blocks)
  return analyse(macd)
}

export const analyse = (macd: MACDResult): number => {
  if(macd.blocks.length < 3) {
    throw Error('Not enough data')
  }

  // v0 oldest, v1 middel, v2 now
  const b = getMaturedHistogram(macd, 3)
  const result = allPositives(b) && b[0] < b[1] && b[1] > b[2]

  logger.debug(`DOWNSWING: [ ${b[0]} | ${b[1]} | ${b[2]} ] -> ${result}`)

  return result ? 1 : 0
}
