import KrakenClient from 'kraken-api'
import { config } from '../common/config'
import { KrakenService } from '../kraken/krakenService'
import { setupDb } from '../../test/test-setup'
import { PositionsService } from '../positions/positions.service'
import PositionModel from '../positions/position.model'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { BuyAnalyst } from '../analysts/buyAnalyst'
import { FullProfitBot } from './fullProfitBot'
import { SellAnalyst } from '../analysts/sellAnalyst'

let positionsService: PositionsService
let krakenApi: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
let analyst: SellAnalyst
let bot: FullProfitBot

// setup db
setupDb('fullProfitBot')

beforeEach(() => {
  positionsService = new PositionsService()
  krakenApi = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenApi, config)
  watcher = new AssetWatcher(krakenService, config)
  analyst = new BuyAnalyst(watcher, config)

  bot = new FullProfitBot(krakenService, positionsService, analyst, config)
})

describe('FullProfitBot', () => {

  it('should fallback to zero if available amount is less than 1000 $', async () => {

  })
})
