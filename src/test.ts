import KrakenClient from 'kraken-api'
import connect from './common/db/connect'
import { PositionsService } from './positions/positions.service'
import { config } from './common/config'
import { KrakenService } from './kraken/krakenService'
import { BuyBot } from './bots/buyBot'
import { BuyAnalyst } from './analysts/buyAnalyst'
import { AssetWatcher } from './assetWatcher/assetWatcher'
import { DcaService } from './common/dca'

(async function() {

  await connect('mongodb://localhost:27017/kraken-test')

  const positionsService = new PositionsService()
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const krakenService = new KrakenService(krakenApi, config)
  // const watcher = new AssetWatcher(krakenService, config)
  // const analyst = new BuyAnalyst(watcher, config)
  // const dca = new DcaService(positionsService)

  const order = await krakenService.getOrder({ id: 'OWXQEC-3RDPI-RRBPLS' })
  console.log(order)

})()
