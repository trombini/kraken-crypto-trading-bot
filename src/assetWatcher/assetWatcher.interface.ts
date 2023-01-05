import { OhlcCandle } from '../krakenPlus/ohlc/ohlc'

// TODO: rename interface
export interface AssetsWatcherUpdateEvent {
  period: number
  pair: string
  head: OhlcCandle
  candles: OhlcCandle[]
}

export interface AssetWatcherObserver {
  analyseAssetData(data: AssetsWatcherUpdateEvent): Promise<void>
}
