import { Analyst, ANALYST_EVENTS } from '../analysts/analyst'
import { Recommendation } from '../common/interfaces/trade.interface'
import { KrakenService } from '../kraken/krakenService'
import { logger } from '../common/logger'
import { BotConfig } from '../common/config'
import { slack } from '../slack/slack.service'
import { round } from 'lodash'
import { PositionsService } from '../positions/positions.service'
import { Position } from '../positions/position.interface'
import { formatMoney, formatNumber, positionId } from '../common/utils'
import { inWinZone } from './utils'

export class FullProfitBot {

  constructor(
    readonly kraken: KrakenService,
    readonly positionService: PositionsService,
    readonly analyst: Analyst,
    readonly config: BotConfig,
  ) {
    if (analyst) {
      analyst.on(ANALYST_EVENTS.SELL, (data: Recommendation) => {
        this.handleSellRecommendation(data)
      })
    }
  }

  async handleSellRecommendation(recommendation: Recommendation) {
    const currentBidPrice = await this.kraken.getBidPrice(recommendation.pair)
    const positions = await this.positionService.find({
      pair: this.config.pair,
      status: 'open'
    })

    positions.forEach(async position => {
      if(inWinZone(position, currentBidPrice, this.config.targetProfit, this.config.tax)) {
        logger.info(`Position ${positionId(position)} is in WIN zone. Sell now! 🤑`)
        // const p = await this.sellPosition(position, currentBidPrice)
        // if(p) {
        //   await this.evaluateProfit(p)
        // }
      }
      else {
        logger.info(`Unfortunately position ${positionId(position)} is not yet in WIN zone 🤬`)
      }
    })
  }
}
