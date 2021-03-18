import { AssetsWatcherUpdateEvent, AssetWatcherObserver } from './assetWatcher.interface'
import { BotConfig } from '../common/config'
import { KrakenService } from '../kraken/krakenService'
import { logger } from '../common/logger'

const delay = 6
export class AssetWatcher {
  intervals: any[]
  observers: any[]

  constructor(readonly kraken: KrakenService, readonly config: BotConfig) {
    this.intervals = []
    this.observers = []
  }

  async fetchData(period: number): Promise<AssetsWatcherUpdateEvent> {
    const result = await this.kraken.getOHLCData(this.config.pair, period)
    return {
      period,
      pair: this.config.pair,
      head: result.head,
      blocks: result.blocks
    }
  }

  startWatcher(period: number) {
    logger.info(`Start AssetWatcher for period ${period}`)
    this.intervals[period] = setInterval(async () => {
      try {
        const data = await this.fetchData(period)
        const observers = this.observers[period]
        if (observers) {
          observers.forEach((observer: AssetWatcherObserver) => {
            observer.analyseAssetData(data)
          })
        }
      }
      catch(err) {
        logger.error(err)
      }
    }, 30 * 1000)
  }

  start(periods: number[]) {
    logger.info(`Start AssetWatchers with a ${delay} second delay (so we don't hit the API limit)`)
    periods.forEach((period, index) => {
      setTimeout(() => {
        this.startWatcher(period)
      }, (index * delay) * 1000)
    })
  }

  subscribe(observer: AssetWatcherObserver, period: number) {
    if(!this.observers[period]) {
      this.observers[period] = []
    }
    this.observers[period].push(observer)
    logger.info(`Analyst subscribed to period ${period}`)
  }

  // stop() {
  //   if(this.interval) {
  //     clearInterval(this.interval)
  //   }
  // }
}
