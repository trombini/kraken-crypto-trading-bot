import { Analyst } from './analyst'
import { BotConfig } from './interfaces/botConfig.interface'
import { KrakenApi } from './krakenApi'
import { KrakenService, OHLCBlock } from './krakenService'
import { Watcher } from './watcher'

let config: BotConfig
let watcher: Watcher
let blocks: OHLCBlock[]

beforeEach(() => {

  config = {
    interval: 5,
    pair: 'ADAUSD',
    blockMaturity: 0.75
  }

  const krakenApi = new KrakenApi('', '')
  const krakenService = new KrakenService(krakenApi, config)
  watcher = new Watcher(krakenService, config)

  blocks = [{
    time: 1,
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    volume: 1
  }]
})

describe('Analyst', () => {

  it('should not trigger BUY event if analysis was negative', () => {
    const analyst = new Analyst(watcher, config)
    const spy = jest.spyOn(analyst, 'sendRecommendationToBuyEvent')
    const mock = jest.spyOn(analyst, 'analyse').mockResolvedValue([true, true, false])

    return analyst.analyseMarketData({
      pair: 'foo',
      head: blocks[0],
      blocks: blocks
    }).then(_ => {
      expect(spy).toBeCalledTimes(0)
    })
  })

  it('should trigger BUY event if analysis was positive', () => {
    const analyst = new Analyst(watcher, config)
    const spy = jest.spyOn(analyst, 'sendRecommendationToBuyEvent')
    const mock = jest.spyOn(analyst, 'analyse').mockResolvedValue([true, true])

    return analyst.analyseMarketData({
      pair: 'foo',
      head: blocks[0],
      blocks: blocks
    }).then(_ => {
      expect(spy).toHaveBeenCalled()
      expect(spy).toBeCalledTimes(1)
    })
  })

})
