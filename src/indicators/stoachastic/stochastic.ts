import { round, takeRight } from 'lodash'
import { Stochastic } from 'technicalindicators'
import { OHLCBlock } from '../../common/interfaces/interfaces'
import { convertToStochasticInput } from '../common/utils'
import { logger } from '../../common/logger'

// Stochastic Fast
export const stochastic = (name: string) => (blocks: OHLCBlock[]): number  => {

  const input = convertToStochasticInput(blocks)
  const stochasticOutput = Stochastic.calculate(input)
  const { k, d } = takeRight(stochasticOutput, 1)[0]
  const confidence = mapOutputToConfindence(k, d)

  logger.debug(`STOCHASTIC ${name}: [ k: ${round(k, 2)} | d: ${round(d, 2)} ] => ${confidence}`)

  return confidence
}

export const mapOutputToConfindence = (k: number, d: number) => {
  if(k > 50 || d > 50) {
    return 0
  }
  else if(k > d) {
    return 1
  }
  else if(k < d && (d - k) <= 2) {
    return 0.8
  }
  else if(k < d && (d - k) <= 4) {
    return 0.5
  }
  else {
    return 0
  }
}
