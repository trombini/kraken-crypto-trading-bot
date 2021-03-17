import KrakenClient from 'kraken-api'
import { Bot, calculateRisk, caluclateVolume } from './bot'
import { config } from './common/config'
import { KrakenService } from './kraken/krakenService'
import { setupDb } from '../test/test-setup'
import { PositionsService } from './positions/positions.service'
import PositionModel from './positions/position.model'
import { AssetWatcher } from './assetWatcher/assetWatcher'
import { BuyAnalyst } from './analysts/buyAnalyst'

let positionsService: PositionsService
let krakenApi: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
let analyst: BuyAnalyst
let bot: Bot

// setup db
setupDb('bot')

beforeEach(() => {
  positionsService = new PositionsService()
  krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  krakenService = new KrakenService(krakenApi, config)
  watcher = new AssetWatcher(krakenService, config)
  analyst = new BuyAnalyst(watcher, config)

  bot = new Bot(krakenService, positionsService, analyst, config)
})

describe('BOT', () => {

  it('should fallback to zero if available amount is less than 1000 $', async () => {
    const risk = calculateRisk(1000, 500, 2000, 1)
    expect(risk).toBe(0)
  })

  it('should calculate correct RISK if availableCurrency is less than MAX_BET', async () => {
    const factor = 0.8
    const risk = calculateRisk(0, 1100, 2000, 1)
    expect(risk).toBe(1100 * factor)
  })

  it('should calculate correct RISK based on availableCurrency and the configured MAX_BET', async () => {
    const risk = calculateRisk(0, 3000, 2000, 1)
    expect(risk).toBe(2000)
  })

  it('should calculate correct RISK based on the reduced conficence', async () => {
    const risk = calculateRisk(0, 1000, 1000, 0.6)
    expect(risk).toBe(600)
  })

  it('should calculate correct RISK based on the reduced availableAmount and conficence', async () => {
    const risk = calculateRisk(0, 2000, 3000, 0.6)
    expect(risk).toBe(2000 * 0.8 * 0.6) // 0.8 is the penalty for having not enough money
  })

  it('should calculate correct volume based on last ask price', async () => {
    const volume = caluclateVolume(1000, 2)
    expect(volume).toBe(500)
  })

  it('should fail to buy the same asset within a short period', async () => {
    // const bot = new Bot(krakenService, positionsService, analyst, config)
    const buyRecommendation = { pair: 'ADAUSD', confidence: 1 }

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
    // max bet is 500
    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'OZORI6-KQCDS-EGXA3P' } ])
    jest.spyOn(krakenService, 'balance').mockResolvedValue(10000)
    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(1.0)
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed' })

    await bot.buyPosition({ pair: 'ADAUSD', confidence: 1 })

    expect(spy).toHaveBeenCalledWith({
      pair: 'ADAUSD',
      volume: 500
    })
  })

  it('should update position details with values from Kraken API', async () => {

    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed', vol: '100', vol_exec: '90', price: '0.95' })

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
