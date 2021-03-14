import { Analyst, ANALYST_EVENTS } from './analysts/analyst'
import { Recommendation } from './common/interfaces/trade.interface'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { BotConfig } from './common/config'
import { slack } from './slack/slack.service'
import { round } from 'lodash'
import { PositionsService } from './positions/positions.service'
import { Position } from './positions/position.interface'
import { formatMoney, formatNumber, positionId } from './common/utils'

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
    const positions = await this.positionService.findByStatus('open')
    positions.forEach(async position => {
      if(this.inWinZone(currentBidPrice, this.config.targetProfit, position)) {
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

  inWinZoneByAmount(currentBidPrice: number, targetProfit: number, volume: number, price: number): boolean {
    const costs = price * volume
    const fee = costs * this.config.tax * 2
    const totalCosts = fee + costs

    const volumeToSell = round((totalCosts / currentBidPrice), 0)
    const expectedProfit = volume - volumeToSell

    logger.debug(`Expected profit: ${expectedProfit}`)

    return expectedProfit > 0 && expectedProfit >= targetProfit

  }

  inWinZoneByPercentage(currentBidPrice: number, targetProfit: number, volume: number, price: number): boolean {
    const costs = price * volume * (1 + this.config.tax)
    const profit = currentBidPrice * volume * (1 - this.config.tax)
    const percentage = 100 * profit / costs

    logger.debug(`FullProfitBot: ${costs} -- ${profit} -- ${percentage}`)
    return percentage > (100 + targetProfit)
  }

  inWinZone(currentBidPrice: number, targetProfit: number, position: Position): boolean {
    if(!position.buy.price || !position.buy.volume) {
      throw new Error(`Not enough data to estimate win zone`)
    }

    if(targetProfit > 1) {
      return this.inWinZoneByAmount(currentBidPrice, targetProfit, position.buy.volume, position.buy.price)
    }
    else {
      return this.inWinZoneByPercentage(currentBidPrice, targetProfit, position.buy.volume, position.buy.price)
    }
  }
}
