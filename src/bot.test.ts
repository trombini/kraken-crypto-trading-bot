import KrakenClient from 'kraken-api'
import { Bot, calculateRisk, caluclateVolume } from './bot'
import { config } from './common/config'
import { KrakenService } from './kraken/krakenService'
import { AssetWatcher } from './assetWatcher'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { PositionsService } from './positions/positions.repo'
import { BetsService } from './bets/bets.service'
import { setupDb } from '../test/test-setup'

let betService: BetsService
let positionsRepo: PositionsService
let krakenApi: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
let analyst: UpswingAnalyst
let bot: Bot

// setup db
setupDb('bot')

beforeEach(() => {
  positionsRepo = new PositionsService()
  betService = new BetsService()
  krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  krakenService = new KrakenService(krakenApi, config)
  watcher = new AssetWatcher(15, krakenService, config)
  analyst = new UpswingAnalyst(watcher, config)

  bot = new Bot(krakenService, betService, positionsRepo, analyst, config)
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

    await bot.buy({ pair: 'ADAUSD' })

    expect(spy).toHaveBeenCalledWith({
      pair: 'ADAUSD',
      volume: 50
    })
  })

  it('after successful buy it should register new position to watch for sell opportunity', async () => {

    const spy = jest.spyOn(positionsRepo, 'add')

    jest.spyOn(krakenService, 'balance').mockResolvedValue(10000)
    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(1.0)
    jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'OZORI6-KQCDS-EGXA3P' } ])
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed', vol: '50', vol_exec: '50', price: '0.95' })

    await bot.buy({ pair: 'ADAUSD' })

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      pair: 'ADAUSD',
      price: 0.95,
      volume: 50
    }))
  })
})
