import KrakenClient from 'kraken-api'
import { Bot, calculateExitStrategy, caluclateVolume } from './bot'
import { config } from './common/config'
import { Trade } from './interfaces/trade.interface'
import { KrakenService } from './krakenService'

let krakenApi: KrakenClient
let krakenService: KrakenService
let fakeTrade: Trade

beforeEach(() => {
  krakenApi = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenApi, config)
  fakeTrade = {
    id: 'someid',
    pair: 'adausd',
    price: 0.9,
    volume: 1000,
    cost: 900,
    fee: 3.24,
    tax: 0.0018,
  }
})

describe('BOT', () => {

  it('should calculate correct target price (with 0.0018% tax)', () => {
    const expectedProfit = 50
    const sellOrder = calculateExitStrategy(expectedProfit, fakeTrade)

    expect(sellOrder.volume + expectedProfit).toBe(fakeTrade.volume)
    expect(sellOrder.price).toBeGreaterThan(fakeTrade.price)
    expect(sellOrder.volume).toBeLessThan(fakeTrade.volume)
    expect(sellOrder.price).toBe(0.9508)
  })

  it('should calculate volume based on MAX_BET and last ask price', async () => {
    const volume = caluclateVolume(500, 0.3)
    expect(volume).toBe(1666.67)
  })

  it('should buy correct volume based on MAX_BET and last ask price', async () => {
    const bot = new Bot(krakenService)
    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue(fakeTrade)
    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(0.3)

    await bot.buy({ pair: 'ADAUSD' })

    expect(spy).toHaveBeenCalledWith({
      pair: 'ADAUSD',
      volume: 1666.67
    })
  })

  it('should fail to buy the same asset within a short period', async () => {
    const bot = new Bot(krakenService)
    const buyRecommendation = { pair: 'ADAUSD' }
    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue(fakeTrade)
    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(99)

    await bot.buy(buyRecommendation)
    await bot.buy(buyRecommendation)
    await bot.buy(buyRecommendation)

    expect(spy).toBeCalledTimes(1)
  })

})
