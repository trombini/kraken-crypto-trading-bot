import KrakenClient from 'kraken-api'
import { config } from '../common/config'
import { KrakenService } from '../kraken/krakenService'
import { setupDb } from '../../test/test-setup'
import { PositionsService } from '../positions/positions.service'
import PositionModel from '../positions/position.model'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { BuyAnalyst } from '../analysts/buyAnalyst'
import { TakeFullProfitBot } from './takeFullProfitBot'
import { SellAnalyst } from '../analysts/sellAnalyst'
import { createLaunchDarklyService, LaunchDarklyService } from '../launchDarkly/launchdarkly.service'
import { createAPI, IKrakenApi } from '../krakenPlus'

let positionsService: PositionsService
let krakenApi: IKrakenApi
let krakenClient: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
let analyst: SellAnalyst
let bot: TakeFullProfitBot
let killswitch: LaunchDarklyService

// setup db
setupDb('takeFullProfitBot')

beforeEach(() => {

  krakenApi = createAPI('key', 'secret')
  krakenClient = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenClient, config)

  positionsService = new PositionsService()
  watcher = new AssetWatcher(krakenService, krakenApi, config)
  analyst = new BuyAnalyst(watcher, config)
  killswitch = createLaunchDarklyService()

  bot = new TakeFullProfitBot(krakenService, positionsService, analyst, killswitch, config)
})

describe('TakeFullProfitBot', () => {

  it('should fallback to zero if available amount is less than 1000 $', async () => {

  })
})
