import events from 'events'
import { BotConfig } from './common/config'
import { logger } from './common/logger'
import { KrakenService } from './krakenService'
import { OHLCBlock } from './interfaces/trade.interface'
import { random } from './common/utils'

export interface WatcherUpdateEvent {
  pair: string
  head: OHLCBlock
  blocks: OHLCBlock[]
}

export class AssetWatcher extends events.EventEmitter {
  constructor(readonly period: number, readonly kraken: KrakenService, readonly config: BotConfig) {
    super()
  }

  fetchData() {
    this.kraken.getOHLCData(this.config.pair, this.period).then(result => {
      this.emit('WATCHER:UPDATE', {
        pair: this.config.pair,
        head: result.head,
        blocks: result.blocks
      })
    })
  }

  start() {
    //this.fetchData()
    setTimeout(() => {
      logger.info(`Start AssetWatcher for [${this.config.pair}] with period ${this.period} minutes`)
      setInterval(() => {
        this.fetchData()
      }, random(15, 30) * 1000)
    }, 0)

  }
}
