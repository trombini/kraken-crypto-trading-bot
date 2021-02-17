import { last, takeRight } from 'lodash'
import { MACD } from 'technicalindicators'
import { BotConfig } from '../../common/config'
import { OHLCBlock } from '../../krakenService'
import { logger } from '../../common/logger'
import { allNegatives, getMaturedBlocks, getBlockMaturity } from '../utils'
import { round } from 'lodash'
import { MACDOutput } from 'technicalindicators/declarations/moving_averages/MACD'

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
    logger.debug(`MACD BUY/SIGNAL: [${round(head.MACD, 4)} | ${round(head.signal, 4)} | ${delta}] -> ${macdAboveSignal}`)

    return macdBelowZero && macdAboveSignal
  }
  return false
}

export const indicator = (interval: number, blockMaturity: number, head: OHLCBlock, blocks: OHLCBlock[]) => {

  const headMaturity = getBlockMaturity(interval, head)
  const maturedBlocks = getMaturedBlocks(interval, blockMaturity, blocks)

  if(headMaturity < blockMaturity) {
    logger.debug(`MACD BUY: block maturity: ${headMaturity}. Needs to be above ${blockMaturity}.`)
  }

  // reduce input to "close" values, MACD is not interested in anything else
  const closes = maturedBlocks.map(b => b.close)
  const macdOutput = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })

  const historgram = macdOutput.map(e => e.histogram || 0)
  return isUpSwing(historgram) && macdCrossesAboveSignal(macdOutput)
}
