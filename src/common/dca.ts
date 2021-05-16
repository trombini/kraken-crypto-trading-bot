import { flatMap, mapKeys, round } from 'lodash'
import { PositionsService } from '../positions/positions.service'
import { Position } from '../positions/position.interface'
import { logger } from './logger'
import { positionId } from './utils'

const bucket = (deviation: number, number: number) => {
  const input = round(number, 2)
  const percent = 100 * deviation
  return Math.floor((input * 100) / percent)
}

const createBuckets = (
  positions: Position[],
): { [key: string]: Position[] } => {
  return positions.reduce((acc, position) => {
    if (position.buy.price) {
      const b = bucket(0.04, position.buy.price)

      console.log(`${b}: ${position.buy.price}`)

      if (acc[b] === undefined) {
        acc[b] = []
      }
      acc[b].push(position)
      return acc
    }
    return acc
  }, {})
}

const dollarCostAverage = (
  positions: Position[],
): { pair: string; volume: number; price: number } => {
  const merged = positions.reduce(
    (acc, position) => {
      const price = position.buy.price || 0
      const volume = position.buy.volume || 0
      return {
        pair: position.pair,
        volume: acc.volume + volume,
        costs: acc.costs + price * volume,
      }
    },
    { pair: '', volume: 0, costs: 0 },
  )

  return {
    pair: merged.pair,
    volume: merged.volume,
    price: merged.costs / merged.volume,
  }
}

export class DcaService {
  constructor(private readonly positions: PositionsService) {}

  async dcaOpenPositions() {
    logger.info(`Run DCA`)
    const allOpenPositions = await this.positions.findByStatus('open')
    const buckets = createBuckets(allOpenPositions)

    console.log(buckets)

    mapKeys(buckets, async (positions, key) => {
      if (positions.length > 1) {
        const orderIds = flatMap(positions.map((p) => p.buy.orderIds)).map(
          (id) => id!,
        )
        const dcaPosition = dollarCostAverage(positions)
        logger.info(`DCA position: ${JSON.stringify(dcaPosition)}`)

        positions.map(async (pos) => {
          logger.debug(`Mark position ${positionId(pos)} as 'merged'`)
          await this.positions.update(pos, { status: 'merged' })
        })

        await this.positions.create({
          pair: dcaPosition.pair,
          status: 'open',
          price: dcaPosition.price,
          volume: dcaPosition.volume,
          orderIds: orderIds,
        })
      }
    })
  }
}
