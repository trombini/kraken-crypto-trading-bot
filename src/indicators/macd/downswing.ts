import { OhlcCandle } from 'src/krakenPlus/ohlc/ohlc'
import { Logger } from '../../common/logger'
import { allPositives } from '../common/utils'
import { calculateMACD, getMaturedHistogram, MACDResult } from './utils'

const logger = Logger('IndicatorDownswing')

export const downswing = (period: number, requiredBlockMaturity: number) => (blocks: OhlcCandle[]): number => {
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
  const confidence = result ? 1 : 0

  logger.debug(`DOWNSWING: [ ${b[0]} | ${b[1]} | ${b[2]} ] -> ${confidence}`)

  return confidence
}
