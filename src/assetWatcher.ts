import events from 'events'
import { BotConfig } from './common/config'
import { logger } from './common/logger'
import { KrakenService } from './kraken/krakenService'
import { OHLCBlock } from './common/interfaces/trade.interface'
import { random } from './common/utils'

export interface AssetsWatcherUpdateEvent {
  period: number
  pair: string
  head: OHLCBlock
  blocks: OHLCBlock[]
}

export enum ASSETS_WATCHER_EVENTS {
  UPDATE = 'ASSETS_WATCHER:UPDATED'
}

export class AssetWatcher extends events.EventEmitter {

  interval: NodeJS.Timeout | undefined

  constructor(readonly period: number, readonly kraken: KrakenService, readonly config: BotConfig) {
    super()
  }

  fetchData() {
    this.kraken.getOHLCData(this.config.pair, this.period).then(result => {
      this.emit(ASSETS_WATCHER_EVENTS.UPDATE, ({
        period: this.period,
        pair: this.config.pair,
        head: result.head,
        blocks: result.blocks
      }) as AssetsWatcherUpdateEvent)
    })
  }

  start() {
    logger.info(`Start AssetWatcher for [${this.config.pair}] with period ${this.period} minutes`)
    this.fetchData()
    return this.interval = setInterval(() => {
      this.fetchData()
    }, 30 * 1000)
  }

  stop() {
    if(this.interval) {
      clearInterval(this.interval)
    }
  }
}
