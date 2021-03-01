import { PositionsService } from '../positions/positions.service'
import { round, mapKeys, flatMap, uniq } from 'lodash'
import { Position } from '../positions/position.interface'
import connect from '../common/db/connect'

(async function() {

  await connect('mongodb://localhost:27017/kraken-prod')

  const bucket = (base: number, deviation: number, number: number) => {
    const input = round(number, 2)
    const percent = 100 * deviation
    return Math.floor(input * (100 / base) / percent)
  }

  console.log(bucket(1, 0.02, 0.01))
  console.log(bucket(1, 0.02, 1.01))
  console.log(bucket(1, 0.02, 1.02))
  console.log(bucket(1, 0.02, 1.03))
  console.log(bucket(1, 0.02, 1.08))
  console.log(bucket(1, 0.02, 1.09))
  console.log(bucket(1, 0.02, 9.99))


  console.log('-----')

  console.log(bucket(10, 0.02, 10))
  console.log(bucket(10, 0.02, 19.9))
  console.log(bucket(10, 0.02, 20))
  console.log(bucket(10, 0.02, 20.1))
  console.log(bucket(10, 0.02, 20.3))
  console.log(bucket(10, 0.02, 99.90))
  console.log(bucket(10, 0.02, 99.99))


  const createBuckets = (positions: Position[]) : { [key: string]: Position[] } => {
    return positions.reduce((acc, position) => {
      if(position.buy.price) {
        const b = bucket(1, 0.03, position.buy.price)
        if(acc[b] === undefined) {
          acc[b] = []
        }
        (acc[b]).push(position)
        return acc
      }
      return acc
    }, {})
  }

  const dollarCostAverage = (positions: Position[]) : { volume: number, price: number } => {

    const merged = positions.reduce((acc, position) => {
      const price = position.buy.price || 0
      const volume = position.buy.volumeExecuted || 0
      return {
        volume: acc.volume + volume,
        costs: acc.costs + (price * volume)
      }
    }, { volume: 0, costs: 0 })

    return {
      volume: merged.volume,
      price: merged.costs / merged.volume
    }
  }

  const service = new PositionsService()
  service.findByStatus('open').then(positions => {
    const buckets = createBuckets(positions)
    mapKeys(buckets, async (positions, key) => {
      if(positions.length > 1) {
        const orderIds = uniq(flatMap(positions.map(p => p.buy.orderIds)))
        const dca = dollarCostAverage(positions)

        console.log(dca)
        console.log(positions)
        console.log(orderIds)

        positions.map(async pos => {
          await service.update(pos, { status: 'merged' })
        })

        await service.create({
          pair: 'ADAUSD',
          status: 'open',
          price: dca.price,
          volume: dca.volume,
          orderIds: []
          //orderIds: orderIds
        })
      }
    })
  })
})()
