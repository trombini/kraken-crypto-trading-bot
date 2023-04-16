import { calculateMACD, getMaturedHistogram, MACDResult } from './utils'
import { logger } from '../../common/logger'
import { OhlcCandle } from '../../krakenPlus/ohlc/ohlc'

// The last three histogram values are in an increasing order -> an uptrend
export const uptrend = (name: string, period: number, requiredBlockMaturity: number) => (candles: OhlcCandle[]): number => {
  const macd = calculateMACD(period, requiredBlockMaturity, candles)
  const filteredBlocks = filterLatestHistogramData(macd)
  const confidence = calculateConfidence(filteredBlocks)

  logger.debug(`UPTREND (${name}): [ ${filteredBlocks[0]} | ${filteredBlocks[1]} | ${filteredBlocks[2]} ] -> ${confidence}`)

  return confidence
}

export const filterLatestHistogramData = (macd: MACDResult) => {
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
  const result = blocks[0] < blocks[1] && blocks[1] < blocks[2]
  const confidence = result ? 1 : 0

  return confidence
}
