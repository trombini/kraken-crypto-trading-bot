import { round } from 'lodash'
import { Position } from '../positions/position.interface'
import { logger } from '../common/logger'

export const inWinZoneByAmount = (
  volume: number,
  price: number,
  currentBidPrice: number,
  targetProfit: number,
  tax: number,
): boolean => {
  const costs = price * volume
  const fee = costs * tax * 2
  const totalCosts = fee + costs
  const volumeToSell = round(totalCosts / currentBidPrice, 0)
  const expectedProfit = volume - volumeToSell

  logger.debug(`Expected profit: ${expectedProfit}`)

  return expectedProfit > 0 && expectedProfit >= targetProfit
}

export const inWinZoneByPercentage = (
  volume: number,
  price: number,
  currentBidPrice: number,
  targetProfit: number,
  fee: number,
): boolean => {

  const purchaseFee = price * volume * fee
  const initialCosts = (price * volume) + purchaseFee

  const salesFee = currentBidPrice * volume * fee
  const currentProfit = (currentBidPrice * volume) - salesFee
  const percentage = ((100 * currentProfit) / initialCosts - 100)
  // const realTargetProfit = Math.pow(volume, -1) + 0.01

  logger.debug(`Determining WIN zone by Percentage`)
  logger.debug(`volume: ${volume}, targetProfit: ${round(targetProfit, 4)}, initialCosts: ${round(initialCosts, 2)}, currentProfit: ${round(currentProfit, 4)}, percentage:${round(percentage, 2)}%`)

  return percentage >= (100 * targetProfit)
}

export const inWinZone = (
  position: Position,
  currentBidPrice: number,
  targetProfitAmount: number,
  targetProfitPercentage: number,
  tax: number,
): boolean => {
  if (!position.buy.price || !position.buy.volume) {
    throw new Error(`Not enough data to estimate win zone`)
  }

  const resultAmount = inWinZoneByAmount(
    position.buy.volume,
    position.buy.price,
    currentBidPrice,
    targetProfitAmount,
    tax,
  )

  const resultPercentage = inWinZoneByPercentage(
    position.buy.volume,
    position.buy.price,
    currentBidPrice,
    targetProfitPercentage,
    tax,
  )

  return resultAmount || resultPercentage
  // if (targetProfit > 1) {
  //   return inWinZoneByAmount(
  //     position.buy.volume,
  //     position.buy.price,
  //     currentBidPrice,
  //     targetProfit,
  //     tax,
  //   )
  // } else {
  //   return inWinZoneByPercentage(
  //     position.buy.volume,
  //     position.buy.price,
  //     currentBidPrice,
  //     targetProfit,
  //     tax,
  //   )
  // }
}
