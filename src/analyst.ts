import { Watcher, WatcherUpdateEvent } from './watcher'
import { indicator as macdIndicator } from './indicators/macdIndicator'
import { BotConfig } from './interfaces/botConfig.interface'
import { OHLCBlock } from './krakenService'
import { filter } from 'lodash'
import moment from 'moment'
import events from 'events'

export class Analyst extends events.EventEmitter {

  constructor(readonly watcher: Watcher, readonly config: BotConfig) {
    super()

    watcher.on('WATCHER:UPDATE', (data: WatcherUpdateEvent) => {
      this.analyseMarketData(data)
    })
  }

  analyseMarketData(data: WatcherUpdateEvent): Promise<void> {
    return this.analyse(data.head, data.blocks).then(result => {
      const positive = filter(result, r => r === true).length === result.length
      const blockDate = moment.unix(data.head.time).format()
      if(positive) {
        console.log(`Buy '${data.pair}'  🚀 🤑`)
        this.sendRecommendationToBuyEvent(data.pair, data.head)
      }
      else {
        console.log(`Don't buy block ${blockDate} 🤬`)
      }
    })
  }

  analyse(head: OHLCBlock, blocks: OHLCBlock[]) {
    return Promise.all([
      macdIndicator(this.config, head, blocks),
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
