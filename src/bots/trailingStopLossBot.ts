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

// Trailing Stop/Stop-Loss
export class TrailingStopLossBot {

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
        let soldPosition = await this.sellPosition(position, currentBidPrice)
        if(soldPosition) {
          let evaluatedPosition = await this.evaluateProfit(soldPosition)

          // lazy retriy. how can we do that better?
          if(!evaluatedPosition) {
            evaluatedPosition = await this.evaluateProfit(soldPosition)
          }

          this.sendSlackMessage(evaluatedPosition)
        }
      }
      else {
        logger.info(`Unfortunately position ${positionId(position)} is not yet in WIN zone 🤬`)
      }
    })
  }

  async sellPosition(position: Position, currentBidPrice: number): Promise<Position | undefined> {
    if(position.buy.price && position.buy.volume) {

      const costs = position.buy.price * position.buy.volume
      const fee = costs * this.config.tax * 2
      const totalCosts = fee + costs
      const volumeToSell = round((totalCosts / currentBidPrice), 0)
      const volumeToKeep = position.buy.volume - volumeToSell

      if(volumeToKeep < 0) {
        throw Error(`Expected profit for ${positionId(position)} would be negative. Stop the sell!`)
      }

      try {
        logger.info(`Create SELL order for ${positionId(position)}. volume: ${volumeToSell}, price: ~ ${currentBidPrice}, keep: ${volumeToKeep}`)

        // update the status of the position so that we don't end up selling it multiple times
        await this.positionService.update(position, {
          'status': 'selling',
          'sell.volumeToKeep': volumeToKeep
        })

        // create SELL order with Kraken
        const orderIds = await this.kraken.createSellOrder({ pair: position.pair, volume: volumeToSell })
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

  async evaluateProfit(position: Position) {
    try {
      logger.debug(`Fetch order details for orders '${position.sell.orderIds?.join(',')}'`)

      if(position.sell.orderIds && position.sell.orderIds.length > 0) {
        const orderId = position.sell.orderIds[0]
        const order = await this.kraken.getOrder({ id: orderId })

        if(order === undefined) {
          throw new Error(`SELL order '${JSON.stringify(orderId)}' returned 'undefined'. we need to fix this manally. Position ${positionId(position)}`)
        }

        // update position to keep track of profit
        const price = parseFloat(order.price)
        const volumeSold = parseFloat(order.vol_exec) || 0
        const profit = (position.buy.volume || 0) - volumeSold
        await this.positionService.update(position, {
          'sell.price': price,
          'sell.volume': volumeSold,
          'sell.profit': profit
        })

        logger.info(`Successfully executed SELL order of ${round(volumeSold, 0)} for ${price}`)
        logger.debug(`SELL order: ${JSON.stringify(order)}`)

        // return latest version of the position
        return this.positionService.findById(position.id)
      }
    }
    catch(err) {
      logger.error(`Error evaluating profit for ${positionId(position)}:`, err)
    }
  }

  sendSlackMessage(position?: Position) {
    if(position) {
      const msg = `
        Successfully SOLD ${positionId(position)} volume ${round(position?.sell?.volume || 0)} for ${formatMoney(position?.sell?.price || 0)}.
        Keeping ${position.sell.profit}.`
      slack(this.config).send(msg)
    }
  }
}
