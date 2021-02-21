import { AssetsWatcherUpdateEvent } from '../assetWatcher'
import { OHLCBlock } from '../common/interfaces/trade.interface'
import { Analyst, ANALYST_EVENTS } from './analyst'
import { indicator as macdIndicator } from '../indicators/sell/macd'
import { logger } from '../common/logger'
import { every } from 'lodash'

export class DownswingAnalyst extends Analyst {

  async analyseMarketData(data: AssetsWatcherUpdateEvent): Promise<void> {
    const results = await this.analyse(data.period, data.head, data.blocks)
    if (every(results, Boolean)) {
      logger.info(`DOWNSWING detected for [${data.pair}]`)
      this.sendRecommendationToSellEvent(data.pair, data.head)
    }
  }

  analyse(period: number, head: OHLCBlock, blocks: OHLCBlock[]) {
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
