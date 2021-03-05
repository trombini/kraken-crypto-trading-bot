import { BotConfig } from '../common/config'
import { ASSETS_WATCHER_EVENTS } from '../assetWatcher'
import events from 'events'
import { AssetsWatcherUpdateEvent, AssetWatcherObserver } from '../assetWatcher/assetWatcher.interface'
import { AssetWatcher } from '../assetWatcher/assetWatcher'

export enum ANALYST_EVENTS {
  SELL = 'ANALYST:SELL',
  BUY = 'ANALYST:BUY'
}

export class Analyst extends events.EventEmitter implements AssetWatcherObserver {

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super()
  }

  analyseAssetData(data: AssetsWatcherUpdateEvent): Promise<void>  {
    throw new Error('Method not implemented.')
  }
}
