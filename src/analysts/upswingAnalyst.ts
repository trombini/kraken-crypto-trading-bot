import { WatcherUpdateEvent } from '../assetWatcher'
import { indicator as macdIndicator } from '../indicators/buy/macd'
import { OHLCBlock } from '../krakenService'
import { logger } from '../common/logger'
import { filter } from 'lodash'
import { Analyst } from './analyst'
import moment from 'moment'

export class UpswingAnalyst extends Analyst {

  analyseMarketData(data: WatcherUpdateEvent): Promise<void> {
    return this.analyse(data.head, data.blocks).then(result => {
      const positive = filter(result, r => r === true).length === result.length
      const blockDate = moment.unix(data.head.time).format()
      if(positive) {
        logger.info(`UPSWING detected for [${data.pair}]`)
        this.sendRecommendationToBuyEvent(data.pair, data.head)
      }
    })
  }

  analyse(head: OHLCBlock, blocks: OHLCBlock[]) {
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
