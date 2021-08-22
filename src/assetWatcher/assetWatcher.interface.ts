import { OHLCBlock } from '../common/interfaces/interfaces'

// TODO: rename interface
export interface AssetsWatcherUpdateEvent {
  period: number
  pair: string
  head: OHLCBlock
  blocks: OHLCBlock[]
}

export interface AssetWatcherObserver {
  analyseAssetData(data: AssetsWatcherUpdateEvent): Promise<void>
}
