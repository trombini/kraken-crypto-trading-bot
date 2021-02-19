import KrakenClient from 'kraken-api'
import { Bot, caluclateVolume } from './bot'
import { config } from './common/config'
import { KrakenService } from './krakenService'
import { v4 as uuidv4 } from 'uuid'
import { AssetWatcher } from './assetWatcher'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { PositionsService } from './positions.service'
import moment from 'moment'

let positionsService: PositionsService
let krakenApi: KrakenClient
let krakenService: KrakenService
let assetWatcher: AssetWatcher
let upswingAnalyst: UpswingAnalyst

const getFakeTrade = (pair: string, volume: number, price: number, time?: number) => {
  const tax = 0.0018
  const cost = price * volume
  return {
    id: uuidv4(),
    time: time || moment().unix(),
    pair: pair,
    price: price,
    volume: volume,
    cost: cost,
    fee: cost * tax,
    tax: tax,
  }
}

beforeEach(() => {
  positionsService = new PositionsService()
  krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  krakenService = new KrakenService(krakenApi, config)
  assetWatcher = new AssetWatcher(config.interval, krakenService, config)
  upswingAnalyst = new UpswingAnalyst(assetWatcher, config)
})

describe('BOT', () => {

  it('should fail to buy the same asset within a short period', async () => {
    const bot = new Bot(krakenService, upswingAnalyst, positionsService, config)
    const buyRecommendation = { pair: 'ADAUSD' }

    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'OZORI6-KQCDS-EGXA3P'} ])
    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(1.0)
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed' })

    await bot.handleBuyRecommendation(buyRecommendation)
    await bot.handleBuyRecommendation(buyRecommendation)
    await bot.handleBuyRecommendation(buyRecommendation)

    expect(spy).toBeCalledTimes(1)
  })


  // it('should calculate correct target price (with 0.0018% tax)', () => {
  //   const expectedProfit = 50
  //   const fakeTrade = getFakeTrade('ADAUSD', 1000, 0.9)
  //   const sellOrder = calculateExitStrategy(expectedProfit, fakeTrade)

  //   expect(sellOrder.volume + expectedProfit).toBe(fakeTrade.volume)
  //   expect(sellOrder.price).toBeGreaterThan(fakeTrade.price)
  //   expect(sellOrder.volume).toBeLessThan(fakeTrade.volume)
  //   expect(sellOrder.price).toBe(0.9508)
  // })

  it('should calculate correct volume based on MAX_BET and last ask price', async () => {
    const volume = caluclateVolume(500, 0.2)
    expect(volume).toBe(2500)
  })

  it('should order correct volume based on MAX_BET and last ask price', async () => {

    const bot = new Bot(krakenService, upswingAnalyst, positionsService, config)

    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'OZORI6-KQCDS-EGXA3P' } ])
    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(1.0)
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed' })

    await bot.buy({ pair: 'ADAUSD' })

    expect(spy).toHaveBeenCalledWith({
      pair: 'ADAUSD',
      volume: 50
    })
  })


  it('after successful buy it should register new position to watch for sell opportunity', async () => {

    const orderId = 'OZORI6-KQCDS-EGXA3P'
    const bot = new Bot(krakenService, upswingAnalyst, positionsService, config)

    const spy = jest.spyOn(positionsService, 'add')

    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(1.0)
    jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: orderId } ])
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ status: 'closed', vol: '50', vol_exec: '50', price: '0.95' })

    await bot.buy({ pair: 'ADAUSD' })

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      pair: 'ADAUSD',
      price: 0.95,
      volume: 50
    }))
  })
})
