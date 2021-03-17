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
        const soldPosition = await this.sellPosition(position, currentBidPrice)
        if(soldPosition) {
          // await this.evaluateProfit(p)
        }
      }
      else {
        logger.info(`Unfortunately position ${positionId(position)} is not yet in WIN zone 🤬`)
      }
    })
  }

  async sellPosition(position: Position, currentBidPrice: number) {
    if(position.buy.price && position.buy.volume) {
      try {
        logger.info(`Create SELL order for ${positionId(position)}. volume: ${position.buy.volume}, price: ~ ${currentBidPrice}, keep: 0`)

        // update the status of the position so that we don't end up selling it multiple times
        await this.positionService.update(position, {
          'status': 'selling'
        })

        // create SELL order with Kraken
        const orderIds = await this.kraken.createSellOrder({
          pair: position.pair,
          volume: position.buy.volume
        })
        logger.info(`Successfully created SELL order for ${positionId(position)}. orderIds: ${JSON.stringify(orderIds)}`)

        // mark position as sold and keep track of the orderIds
        await this.positionService.update(position, {
          'status': 'sold',
          'sell.orderIds': orderIds.map(id => id.id)
        })

        // return latest version of the position
        return this.positionService.findById(position.id)
      }
      catch(err) {
        logger.error(`Error SELL ${positionId(position)}:`, err)
        logger.error(JSON.stringify(err))
      }
    }
  }
}
