import KrakenClient from 'kraken-api'
import { config } from './common/config'
import { KrakenService } from './kraken/krakenService'
import { AssetWatcher } from '../archive/assetWatcher'

let krakenApi: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
beforeEach(() => {

})

afterEach(() => {
  watcher.stop()
})

describe('Test', () => {

  it('', async () => {
    krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
    krakenService = new KrakenService(krakenApi, config)
    watcher = new AssetWatcher(15, krakenService, config)
  })

})
