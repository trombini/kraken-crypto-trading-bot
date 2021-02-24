import { AssetWatcher, AssetsWatcherUpdateEvent } from '../assetWatcher'
import { BotConfig } from '../common/config'
import { ASSETS_WATCHER_EVENTS } from '../assetWatcher'
import events from 'events'

export enum ANALYST_EVENTS {
  SELL = 'ANALYST:SELL',
  BUY = 'ANALYST:BUY'
}

export class Analyst extends events.EventEmitter {

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super()
    watcher.on(ASSETS_WATCHER_EVENTS.UPDATE, (data: AssetsWatcherUpdateEvent) => {
      this.analyseMarketData(data)
    })
  }

  analyseMarketData(data: AssetsWatcherUpdateEvent) {
    // do nothing
  }
}
