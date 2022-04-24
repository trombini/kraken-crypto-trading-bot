import { PositionsService } from '../positions/positions.service'
import { DcaService } from '../common/dca'
import { config } from '../common/config'
import connect from '../common/db/connect'

(async function() {

  await connect(config.mongoDb)

  const service = new PositionsService()
  const dcaService = new DcaService(service)
  await dcaService.dcaOpenPositions()
})()
