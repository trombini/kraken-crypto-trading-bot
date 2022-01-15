import { flatMap, mapKeys, round } from 'lodash'
import { PositionsService } from '../positions/positions.service'
import { Position } from '../positions/position.interface'
import { logger } from './logger'
import { positionId } from './utils'

const PRICE_RANGE = 0.02

// const bucket = (deviation: number, number: number) => {
//   const input = round(number, 2)
//   const percent = 100 * deviation
//   const bucket = Math.floor((input * 100) / percent)
//   return bucket
// }

// const createBuckets = (
//   positions: Position[],
// ): { [key: string]: Position[] } => {
//   return positions.reduce((acc, position) => {
//     if (position.buy.price) {
//       const b = bucket(0.5, position.buy.price)

//       logger.debug(`${b}: ${position.buy.price}`)

//       if (acc[b] === undefined) {
//         acc[b] = []
//       }
//       acc[b].push(position)
//       return acc
//     }
//     return acc
//   }, {})
// }

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

const createBuckets = (positions: Position[]): any => {
  return positions.reduce((acc: Position[][], current: Position) => {


    console.log('-------------')
    // first position, add to accumulator
    // if (acc.length == 0) {
    //   acc.push([ current ])
    //   return acc
    // }

    if(current.buy.price) {

      const bottom = current.buy.price - (current.buy.price * PRICE_RANGE)
      const top = current.buy.price + (current.buy.price * PRICE_RANGE)

      console.log(`Price of current position: ${current.buy.price}, Range: ${bottom} - ${top}`)


       // check if one of the buckets (and positions included) is in the acceptable range
      for(let i = 0 ; i < acc.length ; i++) {
        const bucket = acc[i]
        for(let j = 0 ; j < bucket.length ; j++) {
          const pos = bucket[j]
          if(pos.buy.price) {
            console.log(` Check against ${pos.buy.price}`)
            if(bottom <= pos.buy.price && pos.buy.price <= top) {
              console.log(`  Price of pos ${pos.buy.price} is in range`)
              bucket.push(current)
              return acc
            }
          }
        }
      }
    }

    // current didn't fit into bucket
    acc.push([current])
    return acc
  }, [])
}

export class DcaService {
  constructor(private readonly positions: PositionsService) {}

  async dcaOpenPositions() {
    logger.info(`Run DCA`)
    const allOpenPositions = await this.positions.findByStatus('open')
    const buckets = createBuckets(allOpenPositions)

    logger.debug('DCA buckets')
    logger.debug(JSON.stringify(buckets))

    mapKeys(buckets, async (bucket, key) => {

      if (bucket.length > 1) {
        const orderIds: string[] = flatMap(
          bucket
            .map((position: Position) => position.buy.orderIds)
            .map((id: string) => id!)
        )

        const dcaPosition = dollarCostAverage(bucket)
        logger.info(`DCA position: ${JSON.stringify(dcaPosition)}`)

        bucket.map(async posistion => {
          logger.debug(`Mark position ${positionId(posistion)} as 'merged'`)
          await this.positions.update(posistion, { status: 'merged' })
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
