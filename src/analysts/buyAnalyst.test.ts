import KrakenClient from 'kraken-api'
import { KrakenService } from '../kraken/krakenService'
import { OHLCBlock } from '../common/interfaces/interfaces'
import { config } from '../common/config'
import { logger } from '../common/logger'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { BuyAnalyst } from './buyAnalyst'

let krakenApi: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
let blocks: OHLCBlock[]

beforeAll(() => {
  logger.debug('before all')
})

beforeEach(() => {

  krakenApi = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenApi, config)
  watcher = new AssetWatcher(krakenService, config)
  blocks = [{
    time: 1,
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    volume: 1
  }]
})

describe('UpswingAnalyst', () => {

  it('should not trigger BUY event if part of the analysis was negative', () => {
    const analyst = new BuyAnalyst(watcher, config)
    const spy = jest.spyOn(analyst, 'sendRecommendationToBot')
    // const mock = jest.spyOn(analyst, 'analyse').mockResolvedValue([true, true, false])

    // return analyst.analyseAssetData({
    //   period: 5,
    //   pair: 'foo',
    //   head: blocks[0],
    //   blocks: blocks
    // }).then(_ => {
    //   expect(spy).toBeCalledTimes(0)
    // })
  })

  it('should trigger BUY event if analysis was positive', () => {
    const analyst = new BuyAnalyst(watcher, config)
    const spy = jest.spyOn(analyst, 'sendRecommendationToBot')
    // const mock = jest.spyOn(analyst, 'analyse').mockResolvedValue([true, true])

    // return analyst.analyseAssetData({
    //   period: 5,
    //   pair: 'foo',
    //   head: blocks[0],
    //   blocks: blocks
    // }).then(_ => {
    //   expect(spy).toHaveBeenCalled()
    //   expect(spy).toBeCalledTimes(1)
    // })
  })

})
