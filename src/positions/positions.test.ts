import { setupDb } from '../../test/test-setup'
import { PositionsService } from './positions.service'

// setup db
setupDb('positions-service')

let positionsService: PositionsService

beforeEach(() => {
  positionsService = new PositionsService()
})

describe('PositionsService', () => {

  it('', async () => {



    positionsService.average()







  })
})
