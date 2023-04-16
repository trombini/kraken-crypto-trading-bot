import { calculateMACD, getMaturedHistogram, MACDResult } from './utils'
import { logger } from '../../common/logger'
import { OhlcCandle } from '../../krakenPlus/ohlc/ohlc'
import { last, round, takeRight } from 'lodash'
import { MACDOutput } from 'technicalindicators/declarations/moving_averages/MACD'

// Be more confident if the MACD is still below the ZERO line. Meaning it might have more momentum left to go up vs if it would be already above ZERO.
export const strongUpwardsMomentum = (name: string, period: number, requiredBlockMaturity: number) => (candles: OhlcCandle[]): number => {
  const macd = calculateMACD(period, requiredBlockMaturity, candles)
  const filteredBlock = last(macd.blocks)
  // const filteredBlock2 = filterRelevantBlocks(macd)
  const confidence = calculateConfidence(filteredBlock)

  logger.debug(`MACD STRONG UPWARDS MOMENTUM (${name}): [ ${filteredBlock?.histogram ? round(filteredBlock?.histogram, 4) : 'null' } ] -> ${confidence}`)

  return confidence
}

// export const filterRelevantBlocks = (macd: MACDResult): MACDOutput[]=> {
//   if(macd.blocks.length < 3) {
//     throw Error('Not enough data')
//   }

//   return takeRight(macd.blocks, 1)
// }

export const calculateConfidence = (macd?: MACDOutput): number => {

  if(!macd || !macd.histogram) {
    return 0
  }
  // MACD is ABOVE zero
  else if(macd.histogram > 0) {
    return 0.5
  }
  // MACD is BELOW zero
  else if(macd.histogram < -0.002) {
    return 1.0
  }
  else if(macd.histogram < -0.0015) {
    return 0.9
  }
  else if(macd.histogram < -0.001) {
    return 0.8
  }
  else if(macd.histogram <= 0) {
    return 0.7
  }

  return 0
}
