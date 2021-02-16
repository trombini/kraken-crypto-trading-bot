import { WatcherUpdateEvent } from '../assetWatcher'
import { indicator as macdIndicator } from '../indicators/sell/macd'
import { OHLCBlock } from '../krakenService'
import { logger } from '../common/logger'
import { filter } from 'lodash'
import { Analyst } from './analyst'
import moment from 'moment'

export class DownswingAnalyst extends Analyst {

  analyseMarketData(data: WatcherUpdateEvent): Promise<void> {
    return this.analyse(data.head, data.blocks).then(result => {
      const positive = filter(result, r => r === true).length === result.length
      if(positive) {
        logger.info(`Downswing for '${data.pair}'. Sell now! Go go go 🚀 🤑 🤑 🤑 🤑`)
        this.sendRecommendationToSellEvent(data.pair, data.head)
      }
    })
  }

  analyse(head: OHLCBlock, blocks: OHLCBlock[]) {
    return Promise.all([
      macdIndicator(this.config, head, blocks)
    ])
  }

  sendRecommendationToSellEvent(pair: string, head: OHLCBlock) {
    this.emit('ANALYST:RECOMMENDATION_TO_SELL', {
      pair: pair,
      confidene: 1
    })
  }
}
