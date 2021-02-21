import { WatcherUpdateEvent } from '../assetWatcher'
import { indicator as macdIndicator } from '../indicators/buy/macd'
import { OHLCBlock } from '../common/interfaces/trade.interface'
import { logger } from '../common/logger'
import { every } from 'lodash'
import { Analyst } from './analyst'

export class UpswingAnalyst extends Analyst {
  analyseMarketData(data: WatcherUpdateEvent): Promise<void> {
    return this.analyse(data.head, data.blocks)
      .then(results => {
        if(every(results, Boolean)) {
          logger.info(`UPSWING detected for [${data.pair}]`)
          this.sendRecommendationToBuyEvent(data.pair, data.head)
        }
      })
  }

  analyse(head: OHLCBlock, blocks: OHLCBlock[]): Promise<boolean[]> {
    return Promise.all([
      macdIndicator(15, this.config.blockMaturity, head, blocks)
    ])
  }

  sendRecommendationToBuyEvent(pair: string, head: OHLCBlock) {
    this.emit('ANALYST:RECOMMENDATION_TO_BUY', {
      pair: pair,
      lastPrice: head.close,
      confidene: 1
    })
  }
}
