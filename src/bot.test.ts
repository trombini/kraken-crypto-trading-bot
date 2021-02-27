import KrakenClient from 'kraken-api'
import { Bot, calculateRisk, caluclateVolume } from './bot'
import { config } from './common/config'
import { KrakenService } from './kraken/krakenService'
import { AssetWatcher } from './assetWatcher'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { setupDb } from '../test/test-setup'
import { PositionsService } from './positions/positions.service'
import PositionModel from './positions/position.model'

let positionsService: PositionsService
let krakenApi: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
let analyst: UpswingAnalyst
let bot: Bot

// setup db
setupDb('bot')

beforeEach(() => {
  positionsService = new PositionsService()
  krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  krakenService = new KrakenService(krakenApi, config)
  watcher = new AssetWatcher(15, krakenService, config)
  analyst = new UpswingAnalyst(watcher, config)

  bot = new Bot(krakenService, positionsService, analyst, config)
})

describe('BOT', () => {

  it('should fallback to zero if available amount is less than 1000 $', async () => {
    const risk = calculateRisk(500, 2000)
    expect(risk).toBe(0)
  })

  it('should calculate correct BET based on availableCurrency and the configured MAX_BET', async () => {
    const risk = calculateRisk(1100, 2000)
    expect(risk).toBe(1100)
  })

  it('should calculate correct BET based on availableCurrency and the configured MAX_BET', async () => {
    const risk = calculateRisk(3000, 2000)
    expect(risk).toBe(2000)
  })

  it('should calculate correct volume based on MAX_BET and last ask price', async () => {
    const volume = caluclateVolume(1000, 500, 0.2)
    expect(volume).toBe(2500)
  })

  it('should fail to buy the same asset within a short period', async () => {
    // const bot = new Bot(krakenService, positionsService, analyst, config)
    const buyRecommendation = { pair: 'ADAUSD' }

    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'OZORI6-KQCDS-EGXA3P'} ])
    jest.spyOn(krakenService, 'balance').mockResolvedValue(10000)
    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(1.0)
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed' })

    await bot.handleBuyRecommendation(buyRecommendation)
    await bot.handleBuyRecommendation(buyRecommendation)
    await bot.handleBuyRecommendation(buyRecommendation)

    expect(spy).toBeCalledTimes(1)
  })

  it('should order correct volume based on MAX_BET and last ask price', async () => {
    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'OZORI6-KQCDS-EGXA3P' } ])
    jest.spyOn(krakenService, 'balance').mockResolvedValue(10000)
    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(1.0)
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed' })

    await bot.buyPosition({ pair: 'ADAUSD' })

    expect(spy).toHaveBeenCalledWith({
      pair: 'ADAUSD',
      volume: 50
    })
  })

  it('should update position details with values from Kraken API', async () => {

    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed', vol: '50', vol_exec: '50', price: '0.95' })

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
      'buy.volume': 50,
      'buy.volumeExecuted': 50
    }))

  })
})
