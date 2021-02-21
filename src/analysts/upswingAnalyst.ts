import { AssetsWatcherUpdateEvent } from '../assetWatcher'
import { OHLCBlock } from '../common/interfaces/trade.interface'
import { indicator as macdIndicator } from '../indicators/buy/macd'
import { logger } from '../common/logger'
import { every } from 'lodash'
import { Analyst } from './analyst'

export class UpswingAnalyst extends Analyst {

  analyseMarketData(data: AssetsWatcherUpdateEvent): Promise<void> {
    return this.analyse(data.period, data.head, data.blocks)
      .then(results => {
        if(every(results, Boolean)) {
          logger.info(`UPSWING detected for [${data.pair}]`)
          this.sendRecommendationToBuyEvent(data.pair, data.head)
        }
      })
  }

  analyse(period: number, head: OHLCBlock, blocks: OHLCBlock[]): Promise<boolean[]> {
    return Promise.all([
      macdIndicator(period, this.config.blockMaturity, head, blocks)
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
