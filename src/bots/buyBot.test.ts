import KrakenClient from 'kraken-api'
import { BuyBot, calculateRisk, caluclateVolume } from './buyBot'
import { config } from '../common/config'
import { KrakenService } from '../kraken/krakenService'
import { setupDb } from '../../test/test-setup'
import { PositionsService } from '../positions/positions.service'
import PositionModel from '../positions/position.model'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { BuyAnalyst } from '../analysts/buyAnalyst'
import { DcaService } from '../common/dca'
import { createLaunchDarklyService, LaunchDarklyService } from '../launchDarkly/launchdarkly.service'
import { max, min } from 'lodash'

let dcaService: DcaService
let positionsService: PositionsService
let krakenApi: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
let analyst: BuyAnalyst
let bot: BuyBot
let killswitch: LaunchDarklyService

// setup db
setupDb('buyBot')

beforeEach(() => {

  killswitch = createLaunchDarklyService()
  jest.spyOn(killswitch, 'tripped').mockResolvedValue(false)

  positionsService = new PositionsService()
  dcaService = new DcaService(positionsService)
  krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  krakenService = new KrakenService(krakenApi, config)
  watcher = new AssetWatcher(krakenService, config)
  analyst = new BuyAnalyst(watcher, config)

  bot = new BuyBot(krakenService, positionsService, analyst, dcaService, killswitch, config)
})

describe('BuyBot', () => {

  it('should fail to buy the same asset within a short period', async () => {
    // const bot = new Bot(krakenService, positionsService, analyst, config)
    const buyRecommendation = { pair: 'ADAUSD', confidence: 1 }

    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'OZORI6-KQCDS-EGXA3P'} ])
    jest.spyOn(krakenService, 'balance').mockResolvedValue(1000)
    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(5)
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed' })

    await bot.handleBuyRecommendation(buyRecommendation)
    await bot.handleBuyRecommendation(buyRecommendation)
    await bot.handleBuyRecommendation(buyRecommendation)

    expect(spy).toBeCalledTimes(1)
  })

  it('should order correct volume based on MAX_BET and last ask price', async () => {

    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'OZORI6-KQCDS-EGXA3P' } ])
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed' })

    await bot.buy('ADAUSD', 1, 1, 100)

    expect(spy).toHaveBeenCalledWith({
      pair: 'ADAUSD',
      volume: 100
    })
  })

  it('should update position details with values from Kraken API', async () => {

    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({
      status: 'closed', vol: '100', vol_exec: '90', price: '0.95'
    })

    const spy = jest.spyOn(positionsService, 'update')
    const position = new PositionModel({
      status: 'created',
      buy: {
        orderIds: [ 'a' ]
      }
    })

    await bot.fetchOrderDetails(position)

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      status: 'created',
    }), expect.objectContaining({
      status: 'open',
      'buy.price': 0.95,
      'buy.volume': 90
    }))

  })
})
