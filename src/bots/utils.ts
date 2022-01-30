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
  tax: number,
): boolean => {
  const initialCosts = price * volume * (1 + tax)
  const currentProfit = (currentBidPrice * volume) - (currentBidPrice * volume * tax)
  const percentage = (100 * currentProfit) / initialCosts

  logger.debug(`[WIN ZONE / Percentage]: ${round(initialCosts, 2)} -- ${round(currentProfit, 4)} -- ${round(percentage,2)}`)

  return percentage >= (100 + (100 * targetProfit))
}

export const inWinZone = (
  position: Position,
  currentBidPrice: number,
  targetProfit: number,
  tax: number,
): boolean => {
  if (!position.buy.price || !position.buy.volume) {
    throw new Error(`Not enough data to estimate win zone`)
  }

  if (targetProfit > 1) {
    return inWinZoneByAmount(
      position.buy.volume,
      position.buy.price,
      currentBidPrice,
      targetProfit,
      tax,
    )
  } else {
    return inWinZoneByPercentage(
      position.buy.volume,
      position.buy.price,
      currentBidPrice,
      targetProfit,
      tax,
    )
  }
}
