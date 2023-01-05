import { convertToStochasticInput } from '../common/utils'
import { RSI } from 'technicalindicators'
import { round, takeRight } from 'lodash'
import { logger } from '../../common/logger'
import { OhlcCandle } from 'src/krakenPlus/ohlc/ohlc'

const bestCaseThreshold = 30
const goodThreshold = 40

export const rsi = (name: string) => (blocks: OhlcCandle[]): number  => {

  const ohlc = convertToStochasticInput(blocks)
  const history = RSI.calculate({
    period: 14,
    values: ohlc.close
  })

  const rsi = takeRight(history, 1)[0]
  const confidence = getConfidence(rsi)

  logger.debug(`RSI (${name}) - [${round(rsi, 2)} < ${goodThreshold} => ${confidence}]`)

  return confidence
}

export const getConfidence = (rsi: number) : number => {
  if(rsi < bestCaseThreshold) {
    return 1
  }
  else if(rsi < goodThreshold) {
    return 0.5
  }
  else {
    return 0
  }
}
