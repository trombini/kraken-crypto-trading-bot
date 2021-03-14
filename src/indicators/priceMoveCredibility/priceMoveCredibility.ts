import { get, isNumber, last, sumBy, takeRight } from "lodash"
import { OHLCBlock } from "../../common/interfaces/trade.interface"
import { logger } from "../../common/logger"

// theory: https://www.youtube.com/watch?v=pfJBVC0RktQ&t=115s
export const priceMoveCredibility = (average: number) => (blocks: OHLCBlock[]): number => {
  const volumeRange: OHLCBlock[] = takeRight(blocks, average)
  const volumeRangeSum: number = sumBy(volumeRange, "volume")
  const averageVolume: number = volumeRangeSum / average
  const currentVolume: number | undefined = get(last(blocks), "volume")

  if (!!(
    get(volumeRange, "length", -1) < average ||
    !isNumber(volumeRangeSum) ||
    !isNumber(average) ||
    !isNumber(currentVolume)
  )) {
    throw Error('Invalid data for priceMoveCredibility')
  }

  const priceMoveCredibility: number = (currentVolume / averageVolume) - 1

  logger.debug(`PRICEMOVECRED: ${priceMoveCredibility}`)

  // return 0   if current volume is equal to average volume
  // return < 0 if current volume is below    average volume
  // return > 0 if current volume is above    average volume
  return priceMoveCredibility
}
