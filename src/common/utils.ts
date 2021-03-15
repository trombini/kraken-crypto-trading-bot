import { Position } from '../positions/position.interface'
import { round } from 'lodash'

const numeral = require('numeral')

export const random = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const formatNumber = (number: number) => {
  return numeral(number).format('0,0.00')
}

export const formatMoney = (number: number) => {
  return numeral(number).format('$ 0,0.00')
}

export const positionId = (position: Position) =>
  `[${position.pair}_${round(position.buy.price || 0, 4)}_${round(position.buy.volume || 0, 2)}]`

// export const calculateExitStrategy = (expectedProfit: number, trade: Trade): Order => {
//   // TODO should TAX be configuration?
//   const costs = trade.price * trade.volume
//   const totalFee = costs * trade.tax * 2
//   const sellVolume = trade.volume - expectedProfit
//   const targetPrice = (costs + totalFee) / sellVolume
//   const roundedTargetPrice = round(targetPrice, 4)
//   return {
//     pair: trade.pair,
//     volume: sellVolume,
//     price: roundedTargetPrice,
//   }
// }
