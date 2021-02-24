import KrakenClient from 'kraken-api'
import { config } from './common/config'
import { KrakenService } from './kraken/krakenService'
import { TrailingStopLossBot } from './trailingStopLossBot'
import { ProfitsRepo } from './profit/profit.repo'
import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { AssetWatcher } from './assetWatcher'
import { BetsService } from './bets/bets.service'
import { setupDb } from '../test/test-setup'
import Bet from './bets/bet.model'

let betsService: BetsService
let profitsRepo: ProfitsRepo
let krakenApi: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
let analyst: DownswingAnalyst
let bot: TrailingStopLossBot

// setup db
setupDb('trailingStopLossBot')

beforeEach(() => {
  betsService = new BetsService()
  profitsRepo = new ProfitsRepo()
  krakenApi = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenApi, config)
  watcher = new AssetWatcher(15, krakenService, config)
  analyst = new DownswingAnalyst(watcher, config)
  bot = new TrailingStopLossBot(krakenService, betsService, profitsRepo, analyst, config)
})

describe('TrailingStopLossBot', () => {

  it('should fail because bet doesnt have a price set yet', () => {
    const invalidBet = new Bet({ volume: 1000 })
    const currentBidPrize = 1.05
    const targetProfit = 50
    const result = bot.inWinZone(currentBidPrize, targetProfit, invalidBet)
    expect(result).toBe(false)
  })

  it('should fail because currentBidPrize not yet be in profit range for given bet', () => {
    const highPricedBet = new Bet({ volume: 1000, price: 1 })
    const currentBidPrize = 1.05
    const targetProfit = 50
    const result = bot.inWinZone(currentBidPrize, targetProfit, highPricedBet)
    expect(result).toBe(false)
  })

  it('should succeed successful as currentPrize in profit range for given position', () => {
    const validBet = new Bet({ volume: 1000, price: 1 })
    const currentBidPrize = 1.1
    const targetProfit = 50
    const result = bot.inWinZone(currentBidPrize, targetProfit, validBet)
    expect(result).toBe(true)
  })

  it('should throw error because expected profit would be negative', async (done) => {
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ vol: 1000, vol_exec: 1000, price: 1.0 } )
    jest.spyOn(krakenService, 'createSellOrder').mockResolvedValue([{ id: 'SOME-SELL-ORDER'} ])
    const bet = new Bet({ volume: 1000, price: 1.1 })
    const currentBidPrice = 1.1

    bot.sellPosition(bet, currentBidPrice)
      .then(_ => fail('it should not reach here'))
      .catch(err => {
        expect(err).toBeDefined()
        done()
      })
  })

  it('should mark the bet as closed', async (done) => {
    jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ vol:1000, vol_exec:1000, price:1.0 } )
    jest.spyOn(krakenService, 'createSellOrder').mockResolvedValue([{ id: 'SOME-SELL-ORDER'} ])
    const currentBidPrice = 1.2
    const spy = jest.spyOn(betsService, 'update')
    const betA = new Bet({ date: 'xxx', pair: 'ADAUSD', status: 'xxx', volume: 1000, price: 1.1 })
    await betA.save()

    bot.sellPosition(betA, currentBidPrice)
      .then(_ => {
        expect(spy).toHaveBeenCalledTimes(2)

        // first call updates status to 'processing'
        expect(spy).toHaveBeenNthCalledWith(1,
          expect.objectContaining({ _id: betA._id }),
          expect.objectContaining({ status: 'processing' }))

        // first call updates status to 'closed'
        expect(spy).toHaveBeenNthCalledWith(2,
          expect.objectContaining({ _id: betA._id }),
          expect.objectContaining({ status: 'closed' }))

        done()
      })
  })

})
