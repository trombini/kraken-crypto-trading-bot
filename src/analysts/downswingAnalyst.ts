import { OHLCBlock } from '../common/interfaces/trade.interface'
import { Analyst, ANALYST_EVENTS } from './analyst'
import { indicator as macdIndicator } from '../indicators/buy/macd'
import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { AssetsWatcherUpdateEvent } from '../assetWatcher/assetWatcher.interface'
import { logger } from '../common/logger'
import { every } from 'lodash'

export class DownswingAnalyst extends Analyst {

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super(watcher, config)
    watcher.subscribe(this, 5)
  }

  async analyseAssetData(data: AssetsWatcherUpdateEvent): Promise<void> {
    const results = await this.analyse(data.period, data.head, data.blocks)
    if (every(results, Boolean)) {
      logger.info(`DOWNSWING detected for [${data.pair}]`)
      this.sendRecommendationToSellEvent(data.pair, data.head)
    }
  }

  analyse(period: number, head: OHLCBlock, blocks: OHLCBlock[]): Promise<boolean[]> {
    return Promise.all([
      macdIndicator(period, 0.5, head, blocks)
    ])
  }

  sendRecommendationToSellEvent(pair: string, head: OHLCBlock) {
    this.emit(ANALYST_EVENTS.SELL, {
      pair: pair,
      confidene: 1
    })
  }
}
