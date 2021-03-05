import events from 'events'
import { BotConfig } from '../common/config'
import { logger } from '../common/logger'
import { KrakenService } from '../kraken/krakenService'
import { OHLCBlock } from '../common/interfaces/trade.interface'
import { random } from '../common/utils'
import { AssetsWatcherUpdateEvent, AssetWatcherObserver } from './assetWatcher.interface'

export class AssetWatcher {
  intervals: any[]
  observers: any[]

  constructor(readonly kraken: KrakenService, readonly config: BotConfig) {
    this.intervals = []
    this.observers = []
  }

  fetchData(period: number): Promise<AssetsWatcherUpdateEvent> {
    return this.kraken.getOHLCData(this.config.pair, period)
      .then(result => {
        return {
          period,
          pair: this.config.pair,
          head: result.head,
          blocks: result.blocks
        }
      })
  }

  startWatcher(period: number) {
    logger.info(`Start AssetWatcher for period ${period}`)
    this.intervals[period] = setInterval(async () => {
      const data = await this.fetchData(period)
      const observers = this.observers[period]
      if (observers) {
        observers.forEach((observer: AssetWatcherObserver) => {
          observer.analyseAssetData(data)
        })
      }
    }, 15 * 1000)
  }

  start(periods: number[]) {
    logger.info(`Start AssetWatchers with delay (so we don't hit the API limit)`)
    periods.forEach((period) => {
      const delay = Math.floor(Math.random() * (10 + 1))
      setTimeout(() => {
        this.startWatcher(period)
      }, delay * 1000)
    })
  }

  subscribe(observer: AssetWatcherObserver, period: number) {
    logger.info(`Subscribe to period ${period}`)
    if(!this.observers[period]) {
      this.observers[period] = []
    }
    this.observers[period].push(observer)
  }


  // fetchData() {
  //   this.kraken.getOHLCData(this.config.pair, this.period).then(result => {
  //     this.emit(ASSETS_WATCHER_EVENTS.UPDATE, ({
  //       period: this.period,
  //       pair: this.config.pair,
  //       head: result.head,
  //       blocks: result.blocks
  //     }) as AssetsWatcherUpdateEvent)
  //   })
  // }

  // start() {
  //   logger.info(`Start AssetWatcher for [${this.config.pair}] with period ${this.period} minutes`)
  //   this.fetchData()
  //   return this.interval = setInterval(() => {
  //     this.fetchData()
  //   }, 20 * 1000)
  // }

  // stop() {
  //   if(this.interval) {
  //     clearInterval(this.interval)
  //   }
  // }
}
