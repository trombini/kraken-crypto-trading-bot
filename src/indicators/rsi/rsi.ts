import { OHLCBlock } from '../../common/interfaces/interfaces'
import { convertToStochasticInput } from '../common/utils'
import { RSI } from 'technicalindicators'
import { round, takeRight } from 'lodash'
import { logger } from '../../common/logger'

// RSI
export const rsi = (name: string) => (blocks: OHLCBlock[]): number  => {

  const ohlc = convertToStochasticInput(blocks)
  const history = RSI.calculate({
    period: 14,
    values: ohlc.close
  })

  const threshold = 40
  const rsi = takeRight(history, 1)[0]
  const confidence = rsi < threshold ? 1 : 0

  logger.debug(`RSI (${name}) - ${round(rsi, 2)} < ${threshold} => ${confidence}`)

  return confidence
}
