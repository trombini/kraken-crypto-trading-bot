import { takeRight } from 'lodash'
import { MACD } from 'technicalindicators'
import { BotConfig } from '../../common/config'
import { OHLCBlock } from '../../krakenService'
import { logger } from '../../common/logger'
import { allNegatives, getMaturedBlocks, getBlockMaturity } from '../utils'

// Returns true if last three data points swing from netgative trend to a positive trend
export const isUpSwing = (historgram: number[]) => () => {
  if(historgram.length < 3) {
    throw new Error('Not enough data points')
  }

  // v0 oldest, v1 middel, v2 now
  const v = takeRight(historgram, 3)
  const result = allNegatives(v) && v[0] > v[1] && v[1] < v[2]

  logger.debug(`MACD // isUpswing: ${v[0]} | ${v[1]} | ${v[2]} -> ${result}`)

  return result
}

// Returns true if last three data points lead to up trend
export const isUpTrend = (historgram: number[]) => () => {
  if(historgram.length < 3) {
    throw new Error('Not enough data points')
  }

  // v0 oldest, v1 middel, v2 now
  const v = takeRight(historgram, 3)
  return v[0] < v[1] && v[1] < v[2]
}

export const indicator = (config: BotConfig, head: OHLCBlock, blocks: OHLCBlock[]) => {

  const headMaturity = getBlockMaturity(config.interval, head)
  const maturedBlocks = getMaturedBlocks(config.interval, config.blockMaturity, blocks)

  logger.debug(`Head Block Maturity: ${headMaturity}. Needs to be above ${config.blockMaturity}.`)

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
  const upswing = isUpSwing(historgram)
  const uptrend = isUpTrend(historgram)

  //return upswing() && uptrend()
  return upswing()
}
