import moment from 'moment'
import { PositionsService } from './positions.repo'
import { reduce } from './positions/utils'

const positionsService = new PositionsService()

positionsService.findAll().then(positions => {
  const reducedPositions = reduce(0.02, positions)
  console.log(JSON.stringify(reducedPositions, undefined, 2))
})



const result = {
  date: moment(),
  pair: 'ada'
}


console.log(JSON.stringify(result))
