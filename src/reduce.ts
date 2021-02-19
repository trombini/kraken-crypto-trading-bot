import { PositionsService } from './positions.repo'
import { reduce } from './positions/utils'

const positionsService = new PositionsService()

positionsService.findAll().then(positions => {
  const reducedPositions = reduce(0.02, positions)
  console.log(JSON.stringify(reducedPositions, undefined, 2))
})
