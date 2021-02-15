import events from 'events'
import { BotConfig } from './common/config'
import { KrakenService, OHLCBlock } from './krakenService'

//const INTERVAL = 360000
const INTERVAL = 10

export interface WatcherUpdateEvent {
  pair: string
  head: OHLCBlock
  blocks: OHLCBlock[]
}

export class Watcher extends events.EventEmitter {
  constructor(readonly kraken: KrakenService, readonly config: BotConfig) {
    super()
  }

  fetchData() {
    //console.log(`Fetch new prices for ${this.config.pair}`)
    this.kraken.getOHLCData(this.config.pair, this.config.interval).then(result => {
      this.emit('WATCHER:UPDATE', {
        pair: this.config.pair,
        head: result.head,
        blocks: result.blocks
      })
    })
  }

  start() {
    this.fetchData()
    setInterval(() => {
      this.fetchData()
    }, INTERVAL * 1000)
  }
}
