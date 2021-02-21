import { AssetsWatcherUpdateEvent } from '../assetWatcher'
import { OHLCBlock } from '../common/interfaces/trade.interface'
import { indicator as macdIndicator } from '../indicators/sell/macd'
import { logger } from '../common/logger'
import { every } from 'lodash'
import { Analyst } from './analyst'

export class DownswingAnalyst extends Analyst {

  analyseMarketData(data: AssetsWatcherUpdateEvent): Promise<void> {
    return this.analyse(data.period, data.head, data.blocks)
      .then(results => {
        if(every(results, Boolean)) {
          logger.info(`DOWNSWING detected for [${data.pair}]`)
          this.sendRecommendationToSellEvent(data.pair, data.head)
        }
      })
  }

  analyse(period: number, head: OHLCBlock, blocks: OHLCBlock[]) {
    return Promise.all([
      macdIndicator(period, 0.5, head, blocks)
    ])
  }

  sendRecommendationToSellEvent(pair: string, head: OHLCBlock) {
    this.emit('ANALYST:RECOMMENDATION_TO_SELL', {
      pair: pair,
      confidene: 1
    })
  }
}
