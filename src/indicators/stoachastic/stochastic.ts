import { round, takeRight } from 'lodash'
import { Stochastic } from 'technicalindicators'
import { OHLCBlock } from '../../common/interfaces/interfaces'
import { logger } from '../../common/logger'
import { flattenOhlcInput } from '../common/utils'

// Stochastic Fast
export const stochastic = () => (blocks: OHLCBlock[]): number  => {
  const config = flattenOhlcInput(blocks)
  const stochf = Stochastic.calculate(config)
  const { k, d } = takeRight(stochf, 1)[0]
  return mapOutputToConfindence(k, d)
}

export const mapOutputToConfindence = (k: number, d: number) => {
  let confidence = 0
  if(k > d) {
    confidence = 1
  }
  else if(k < d && (d - k) <= 2) {
    confidence = 0.8
  }
  else if(k < d && (d - k) <= 4) {
    confidence = 0.5
  }
  else {
    confidence = 0
  }

  logger.debug(`STOCHASTIC: [ k: ${round(k, 2)} | d: ${round(d, 2)} ] => ${confidence}`)
  return confidence
}