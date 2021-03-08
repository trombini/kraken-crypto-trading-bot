import { OHLCBlock } from '../../common/interfaces/trade.interface'
import { calculateMACD, getMaturedHistogram } from './utils'
import { allNegatives } from '../common/utils'
import { logger } from '../../common/logger'

export const upswing = (period: number, requiredBlockMaturity: number) => (blocks: OHLCBlock[]): number => {
  const macd = calculateMACD(period, requiredBlockMaturity, blocks)

  if(macd.blocks.length < 3) {
    throw Error('Not enough data')
  }

  // v0 oldest, v1 middel, v2 now
  const b = getMaturedHistogram(macd, 3)
  const result = allNegatives(b) && b[0] > b[1] && b[1] < b[2]

  logger.debug(`UPSWING: [ ${b[0]} | ${b[1]} | ${b[2]} ] -> ${result}`)

  return result ? 1 : 0
}










// export const downswingXX = (period: number, requiredBlockMaturity: number) => (blocks: OHLCBlock[]): number => {
//   const macd = calculateMACD(period, requiredBlockMaturity, blocks)

//   if(macd.blocks.length < 3) {
//     throw Error('Not enough data')
//   }

//   // v0 oldest, v1 middel, v2 now
//   const b = getMaturedHistogram(macd, 3)
//   const result = allPositives(b) && b[0] < b[1] && b[1] > b[2]

//   logger.debug(`DOWNSWING: [ ${b[0]} | ${b[1]} | ${b[2]} ] -> ${result}`)

//   return result ? 1 : 0
// }
