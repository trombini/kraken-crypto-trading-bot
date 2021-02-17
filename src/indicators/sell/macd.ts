import { takeRight } from 'lodash'
import { MACD } from 'technicalindicators'
import { BotConfig } from '../../common/config'
import { OHLCBlock } from '../../krakenService'
import { logger } from '../../common/logger'
import { allPositives, getBlockMaturity, getMaturedBlocks } from '../utils'
import { round } from 'lodash'

// Returns true if last three data points swing from positive trend to a negative trend
export const isDownSwing = (historgram: number[]) => () => {
  if(historgram.length < 3) {
    throw new Error('Not enough data points')
  }

  // v0 oldest, v1 middel, v2 now
  const v = takeRight(historgram, 3).map(v => round(v, 6))
  const result = allPositives(v) && v[0] < v[1] && v[1] > v[2]

  logger.debug(`MACD SELL: [${v[0]} | ${v[1]} | ${v[2]}] -> ${result}`)

  return result
}

// and sell—or short—the security when the MACD crosses below the signal line.
export const signal = () => {

}

export const indicator = (interval: number, blockMaturity: number, head: OHLCBlock, blocks: OHLCBlock[]) => {

  const headMaturity = getBlockMaturity(interval, head)
  const maturedBlocks = getMaturedBlocks(interval, blockMaturity, blocks)

  if(headMaturity < blockMaturity) {
    logger.debug(`MACD BUY: block maturity: ${headMaturity}. Needs to be above ${blockMaturity}.`)
  }

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
  return isDownSwing(historgram)()
  //return true
}
