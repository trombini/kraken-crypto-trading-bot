import events from 'events'
import { BotConfig } from './common/config'
import { logger } from './common/logger'
import { KrakenService, OHLCBlock } from './krakenService'
import { random } from './common/utils'

export interface WatcherUpdateEvent {
  pair: string
  head: OHLCBlock
  blocks: OHLCBlock[]
}

export class AssetWatcher extends events.EventEmitter {
  constructor(readonly interval: number, readonly kraken: KrakenService, readonly config: BotConfig) {
    super()
  }

  fetchData() {
    this.kraken.getOHLCData(this.config.pair, this.interval).then(result => {
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
      logger.info(`Start AssetWatcher for [${this.config.pair}] with interval ${this.interval}`)
      setInterval(() => {
        this.fetchData()
      }, random(15, 30) * 1000)
    }, 0)

  }
}
