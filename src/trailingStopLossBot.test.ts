import KrakenClient from 'kraken-api'
import { config } from './common/config'
import { KrakenService } from './krakenService'
import { TrailingStopLossBot } from './trailingStopLossBot'
import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { AssetWatcher } from './assetWatcher'
import { PositionsService } from './positions.service'

let positionsService: PositionsService
let krakenApi: KrakenClient
let krakenService: KrakenService
let assetWatcher: AssetWatcher
let downswingAnalyst: DownswingAnalyst

beforeEach(() => {
  positionsService = new PositionsService()
  krakenApi = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenApi, config)
  assetWatcher = new AssetWatcher(config.interval, krakenService, config)
  downswingAnalyst = new DownswingAnalyst(assetWatcher, config)
})

describe('TrailingStopLossBot', () => {

  it('currentBidPrize should not yet be in profit range for given position', () => {
    const bot = new TrailingStopLossBot(krakenService, downswingAnalyst, config, positionsService)
    const position = { id: 123, pair: 'ADAUSD', volume: 1000, price: 1.0, tax: 0.0018 }
    const currentBidPrice = 1.05

    const result = bot.inBuyZone(currentBidPrice, 50, position)
    expect(result).toBe(false)
  })

  it('currentBidPrize should be in profit range for given position', () => {
    const bot = new TrailingStopLossBot(krakenService, downswingAnalyst, config, positionsService)
    const position = { id: 123, pair: 'ADAUSD', volume: 1000, price: 1.0, tax: 0.0018 }
    const currentBidPrice = 1.1

    const result = bot.inBuyZone(currentBidPrice, 50, position)
    expect(result).toBe(true)
  })

  it('currentBidPrize should be in profit range for given position', () => {
    const bot = new TrailingStopLossBot(krakenService, downswingAnalyst, config, positionsService)
    const position = { id: 123, pair: 'ADAUSD', volume: 500, price: 1.0, tax: 0.0018 }
    const currentBidPrice = 1.1

    const result = bot.inBuyZone(currentBidPrice, 50, position)
    expect(result).toBe(true)
  })

  it('dd', async () => {
    const bot = new TrailingStopLossBot(krakenService, downswingAnalyst, config, positionsService)
    const position = { id: 123, pair: 'ADAUSD', volume: 1000, price: 1.0, tax: 0.0018 }
    const currentBidPrice = 1.1

    ///bot.sell(position, currentBidPrice)
  })

})
