import { AssetWatcher, WatcherUpdateEvent } from '../assetWatcher'
import { BotConfig } from '../common/config'
import events from 'events'

export class Analyst extends events.EventEmitter {

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super()

    watcher.on('WATCHER:UPDATE', (data: WatcherUpdateEvent) => {
      this.analyseMarketData(data)
    })
  }

  analyseMarketData(data: WatcherUpdateEvent) {
    // do nothing
  }
}
