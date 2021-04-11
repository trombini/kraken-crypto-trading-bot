import KrakenClient from 'kraken-api'
import connect from './common/db/connect'
import { PositionsService } from './positions/positions.service'
import { config } from './common/config'
import { KrakenService } from './kraken/krakenService'

(async function() {

  await connect('mongodb://localhost:27017/kraken-test')

  const positionsService = new PositionsService()
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const krakenService = new KrakenService(krakenApi, config)

})()
