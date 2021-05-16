import { PositionsService } from '../positions/positions.service'
import connect from '../common/db/connect'

(async function() {

  await connect('mongodb://localhost:27017/kraken-prod')

  const service = new PositionsService()
  service.find({ pair: 'ADAUSD', status: 'sold' }).then(positions => {
    const result = positions.reduce((acc, pos) => {
      console.log(`${pos.id} ${pos?.buy?.volume} - ${pos?.sell?.volume} => ${pos?.sell?.volumeToKeep}`)
      const profit = (pos?.buy?.volume || 0) - (pos?.sell?.volume || 0)
      return {
        total: acc.total + profit,
        positions: acc.positions++
      }
    }, { total: 0, positions: 0 })

    console.log(result)
  })
})()
