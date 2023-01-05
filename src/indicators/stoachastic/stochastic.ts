import { round, takeRight } from 'lodash'
import { Stochastic } from 'technicalindicators'
import { convertToStochasticInput } from '../common/utils'
import { logger } from '../../common/logger'
import { OhlcCandle } from '../../krakenPlus/ohlc/ohlc'

// Stochastic Fast
export const stochastic = (name: string) => (candles: OhlcCandle[]): number  => {

  const input = convertToStochasticInput(candles)
  const stochasticOutput = Stochastic.calculate(input)
  const { k, d } = takeRight(stochasticOutput, 1)[0]
  const confidence = mapOutputToConfindence(k, d)

  logger.debug(`STOCHASTIC (${name}) - [d:${round(d, 2)} < k:${round(k, 2)} => ${confidence}]`)

  return confidence
}

// Threshold 30
export const mapOutputToConfindence = (k: number, d: number) => {


  if(k < 30 && d < 30) {

    // this is most bullish case
    if(k >= d) {
      return 1
    }
    else {
      const delta = (d - k)
      if(delta <= 2) {
        return 0.9
      }
      else if(delta <= 6) {
        return 0.8
      }
      else if(delta <= 12) {
        return 0.7
      }
      else {
        return 0.6
      }
    }
  }
  else if(k < 40 && d < 40) {
    return 0.2
  }
  else if(k < 50 && d < 50) {
    return 0.1
  }

  return 0
}


// export const mapOutputToConfindence = (k: number, d: number) => {

//   if(k > 50 && d > 50) {
//     return 0
//   }

//   if(k < 40 && d > 50) {
//     return 0.1
//   }

//   if(k < d) {
//     if((d - k) <= 2) {
//       return 1.0
//     }
//     else if((d - k) <= 6) {
//       return 0.8
//     }
//     else if((d - k) <= 12) {
//       return 0.6
//     }
//   }

//   return 0
// }