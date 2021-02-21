import KrakenClient from 'kraken-api'
import { config } from './common/config'
import { KrakenService } from './kraken/krakenService'
import { TrailingStopLossBot } from './trailingStopLossBot'
import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { AssetWatcher } from './assetWatcher'
import { PositionsService } from './positions/positions.repo'
import { ProfitsRepo } from './profit/profit.repo'
import { assert } from 'console'

let profitsRepo: ProfitsRepo
let positionsService: PositionsService
let krakenApi: KrakenClient
let krakenService: KrakenService
let assetWatcher: AssetWatcher
let downswingAnalyst: DownswingAnalyst
let bot: TrailingStopLossBot

beforeEach(() => {
  profitsRepo = new ProfitsRepo()
  positionsService = new PositionsService()
  krakenApi = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenApi, config)
  assetWatcher = new AssetWatcher(config.interval, krakenService, config)
  downswingAnalyst = new DownswingAnalyst(assetWatcher, config)

  bot = new TrailingStopLossBot(krakenService, downswingAnalyst, config, positionsService, profitsRepo)

})

describe('TrailingStopLossBot', () => {

  it('currentBidPrize should not yet be in profit range for given position', () => {
    const position = { id: '123', pair: 'ADAUSD', volume: 1000, price: 1.0 }
    const currentBidPrice = 1.05
    const targetProfit = 50

    const result = bot.inWinZone(currentBidPrice, targetProfit, position)
    expect(result).toBe(false)
  })

  it('currentBidPrize should not yet be in profit range for given position', () => {
    // Becuase Volume is too low to reach the targetProfit
    const position = { id: '123', pair: 'ADAUSD', volume: 500, price: 1.0 }
    const currentBidPrice = 1.1
    const targetProfit = 50

    const result = bot.inWinZone(currentBidPrice, targetProfit, position)
    expect(result).toBe(false)
  })

  it('currentBidPrize should be in profit range for given position', () => {
    const position = { id: '123', pair: 'ADAUSD', volume: 1000, price: 1.0 }
    const currentBidPrice = 1.1
    const targetProfit = 50

    const result = bot.inWinZone(currentBidPrice, targetProfit, position)
    expect(result).toBe(true)
  })

  it('should throw error', async (done) => {
    const getOrderSpy = jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ vol:1000, vol_exec:1000, price:1.0 } )
    const createSellOrderSpy = jest.spyOn(krakenService, 'createSellOrder').mockResolvedValue([{ id: 'SOME-SELL-ORDER'} ])
    const deletePositionSpy = jest.spyOn(positionsService, 'delete')
    const currentBidPrice = 1.1

    // initiate positions
    const positionA = { id: '123', pair: 'ADAUSD', volume: 1000, price: 1.1 }
    const positionB = { id: '123', pair: 'ADAUSD', volume: 1000, price: 1.1 }
    jest.spyOn(positionsService, 'findAll').mockResolvedValueOnce([positionA, positionB])

    bot.sellPosition(positionA, currentBidPrice)
    .then(_ => fail('it should not reach here'))
    .catch(err => {
      expect(err).toBeDefined()
      done()
    })
  })

  it('xx', async (done) => {
    const getOrderSpy = jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ vol:1000, vol_exec:1000, price:1.0 } )
    const createSellOrderSpy = jest.spyOn(krakenService, 'createSellOrder').mockResolvedValue([{ id: 'SOME-SELL-ORDER'} ])
    const deletePositionSpy = jest.spyOn(positionsService, 'delete')
    const currentBidPrice = 1.2

    // initiate positions
    const positionA = { id: '123', pair: 'ADAUSD', volume: 1000, price: 1.1 }
    const positionB = { id: '123', pair: 'ADAUSD', volume: 1000, price: 1.1 }
    jest.spyOn(positionsService, 'findAll').mockResolvedValueOnce([positionA, positionB])

    bot.sellPosition(positionA, currentBidPrice)
      .then(_ => {
        expect(deletePositionSpy).toHaveBeenCalledWith(positionA)
        done()
      })

    ///bot.sell(position, currentBidPrice)
  })

})
