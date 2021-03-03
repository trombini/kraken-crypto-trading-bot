import { PositionsService } from '../positions/positions.service'
import { round, mapKeys, flatMap, uniq } from 'lodash'
import { Position } from '../positions/position.interface'
import connect from '../common/db/connect'

(async function() {

  await connect('mongodb://localhost:27017/kraken-prod')

  const service = new PositionsService()
  service.findByStatus('sold').then(positions => {
    const result = positions.reduce((acc, pos) => {
      return {
        total: acc.total + (pos.sell?.profit || 0),
        positions: acc.positions++
      }
    }, { total: 0, positions: 0 })

    console.log(result)
  })
})()
