import KrakenClient from 'kraken-api'
import { config } from './common/config'
import { KrakenService } from './kraken/krakenService'
import { PositionsService } from './positions/positions.service'
import { TrailingStopLossBot } from './trailingStopLossBot'
import { ProfitsRepo } from './profit/profit.repo'
import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { AssetWatcher } from './assetWatcher'
import { setupDb } from '../test/test-setup'
import PositionModel from './positions/position.model'

let positionsService: PositionsService
let profitsRepo: ProfitsRepo
let krakenApi: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
let analyst: DownswingAnalyst
let bot: TrailingStopLossBot

// setup db
setupDb('trailingStopLossBot')

beforeEach(() => {
  positionsService = new PositionsService()
  profitsRepo = new ProfitsRepo()
  krakenApi = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenApi, config)
  watcher = new AssetWatcher(15, krakenService, config)
  analyst = new DownswingAnalyst(watcher, config)
  bot = new TrailingStopLossBot(krakenService, positionsService, profitsRepo, analyst, config)
})

describe('TrailingStopLossBot', () => {

  it('should fail because position doesnt have a price set yet', () => {
    const invalidBet = new PositionModel({ volume: 1000 })
    const currentBidPrize = 1.05
    const targetProfit = 50
    const result = bot.inWinZone(currentBidPrize, targetProfit, invalidBet)
    expect(result).toBe(false)
  })

  it('should fail because currentBidPrize not yet be in profit range for given position', () => {
    const highPricedBet = new PositionModel({ volume: 1000, price: 1 })
    const currentBidPrize = 1.05
    const targetProfit = 50
    const result = bot.inWinZone(currentBidPrize, targetProfit, highPricedBet)
    expect(result).toBe(false)
  })

  it('should succeed successful as currentPrize in profit range for given position', () => {
    const validBet = new PositionModel({ buy: { volume: 1000, price: 1 }})
    const currentBidPrize = 1.1
    const targetProfit = 50
    const result = bot.inWinZone(currentBidPrize, targetProfit, validBet)
    expect(result).toBe(true)
  })

  it('should throw error because expected profit would be negative', async (done) => {
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ vol: 1000, vol_exec: 1000, price: 1.0 } )
    jest.spyOn(krakenService, 'createSellOrder').mockResolvedValue([{ id: 'SOME-SELL-ORDER'} ])

    const position = new PositionModel({ buy: { volume: 1000, price: 1.1 }})
    const currentBidPrice = 1.1

    bot.sellPosition(position, currentBidPrice)
      .then(_ => fail('it should not reach here'))
      .catch(err => {
        expect(err).toBeDefined()
        done()
      })
  })

  it('should mark the position as closed', async (done) => {
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ vol: 1000, vol_exec: 1000, price: 1 } )
    jest.spyOn(krakenService, 'createSellOrder').mockResolvedValue([{ id: 'SOME-SELL-ORDER'} ])

    const currentBidPrice = 1.2
    const spy = jest.spyOn(positionsService, 'update')
    const positionA = new PositionModel({ date: 'xxx', pair: 'ADAUSD', status: 'xxx',
      buy: {
        volume: 1000, price: 1.1
      }
    })

    //await positionA.save()

    bot.sellPosition(positionA, currentBidPrice)
      .then(_ => {
        expect(spy).toHaveBeenCalledTimes(2)

        // first call updates status to 'processing'
        expect(spy).toHaveBeenNthCalledWith(1,
          expect.objectContaining({ _id: positionA._id }),
          expect.objectContaining({ status: 'selling' }))

        // first call updates status to 'closed'
        expect(spy).toHaveBeenNthCalledWith(2,
          expect.objectContaining({ _id: positionA._id }),
          expect.objectContaining({ status: 'sold' }))

        done()
      })
  })

  it('should update position with correct profit details', async (done) => {
    const updatePositionSpy = jest.spyOn(positionsService, 'update')
    const getOrderSpy = jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ vol: 80, vol_exec: 80, price: 1.2 } )
    const positionA = new PositionModel({
      pair: 'ADAUSD',
      status: 'sold',
      buy: { volume: 100, volumeExecuted: 100, price: 1.0 },
      sell: { orderIds: [ 'some-order-id' ]}
    })

    bot.evaluateProfit(positionA)
      .then(_ => {
        expect(getOrderSpy).toBeCalledTimes(1)
        expect(updatePositionSpy).toHaveBeenCalledTimes(1)
        // first call updates status to 'processing'
        expect(updatePositionSpy).toHaveBeenNthCalledWith(1,
          expect.objectContaining({ _id: positionA._id }),
          expect.objectContaining({
            'sell.price': 1.2,
            'sell.volume': 80,
            'sell.profit': 20
          }))

        done()
      })
  })

})
