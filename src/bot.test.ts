import KrakenClient from 'kraken-api'
import { Bot, calculateExitStrategy, caluclateVolume } from './bot'
import { config } from './common/config'
import { KrakenService } from './krakenService'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'

let krakenApi: KrakenClient
let krakenService: KrakenService

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
  krakenApi = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenApi, config)
})

describe('BOT', () => {

  it('should calculate correct target price (with 0.0018% tax)', () => {
    const expectedProfit = 50
    const fakeTrade = getFakeTrade('ADAUSD', 1000, 0.9)
    const sellOrder = calculateExitStrategy(expectedProfit, fakeTrade)

    expect(sellOrder.volume + expectedProfit).toBe(fakeTrade.volume)
    expect(sellOrder.price).toBeGreaterThan(fakeTrade.price)
    expect(sellOrder.volume).toBeLessThan(fakeTrade.volume)
    expect(sellOrder.price).toBe(0.9508)
  })

  it('should calculate correct volume based on MAX_BET and last ask price', async () => {
    const volume = caluclateVolume(500, 0.3)
    expect(volume).toBe(1666.67)
  })

  it('should order correct volume based on MAX_BET and last ask price', async () => {
    const bot = new Bot(krakenService)
    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'some-transaction-id'} ])
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
    const spy = jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'some-transaction-id'} ])
    jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(99)

    await bot.buy(buyRecommendation)
    await bot.buy(buyRecommendation)
    await bot.buy(buyRecommendation)

    expect(spy).toBeCalledTimes(1)
  })

  // How could this be tested? KrakenService calculates the transaction date in real time
  // it('should allow multiple buys of the same asset if block period is over', async () => {
  //   const bot = new Bot(krakenService)
  //   const buyRecommendation = { pair: 'ADAUSD' }
  //   const spy = jest.spyOn(krakenService, 'createBuyOrder')
  //   jest.spyOn(krakenService, 'getAskPrice').mockResolvedValue(99)

  //   // buy for the first time
  //   const dateInThePast = moment().subtract(10, 'm').unix()
  //   jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValueOnce([{ id: 'some-transaction-id'} ])
  //   await bot.buy(buyRecommendation)

  //   // buy for the second time -> will succeed
  //   jest.spyOn(krakenService, 'createBuyOrder').mockResolvedValue([{ id: 'some-transaction-id'} ])
  //   await bot.buy(buyRecommendation)

  //   // buy for the third time -> won't suceed
  //   await bot.buy(buyRecommendation)

  //   expect(spy).toBeCalledTimes(2)
  // })

})
