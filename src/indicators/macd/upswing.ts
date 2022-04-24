import { OHLCBlock } from '../../common/interfaces/interfaces'
import { calculateMACD, getMaturedHistogram } from './utils'
import { allNegatives } from '../common/utils'
import { logger } from '../../common/logger'
import { MACDResult } from './macd.interface'

export const upswing = (name: string, period: number, requiredBlockMaturity: number) => (blocks: OHLCBlock[]): number => {
  const macd = calculateMACD(period, requiredBlockMaturity, blocks)
  const filteredBlocks = filterRelevantBlocks(macd)
  const confidence = calculateConfidence(filteredBlocks)

  logger.debug(`UPSWING (${name}): [ ${filteredBlocks[0]} | ${filteredBlocks[1]} | ${filteredBlocks[2]} ] -> ${confidence}`)

  return confidence
}

export const filterRelevantBlocks = (macd: MACDResult) => {
  if(macd.blocks.length < 3) {
    throw Error('Not enough data')
  }
  return getMaturedHistogram(macd, 3)
}

export const calculateConfidence = (blocks: number[]): number => {
  if(blocks.length < 3) {
    throw Error('Not enough data')
  }

    // v0 oldest, v1 middel, v2 now
    const result = allNegatives(blocks) && (blocks[0] > blocks[1] && blocks[1] < blocks[2])
    const confidence = result ? 1 : 0
    return confidence
}
