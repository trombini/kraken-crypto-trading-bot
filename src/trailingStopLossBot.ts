import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { ANALYST_EVENTS } from './analysts/analyst'
import { OrderId, SellRecommendation } from './common/interfaces/trade.interface'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { BotConfig } from './common/config'
import { ProfitsRepo } from './profit/profit.repo'
import { slack } from './slack/slack.service'
import { round } from 'lodash'
import { PositionsService } from './positions/positions.service'
import { Position } from './positions/position.interface'
import { formatMoney, formatNumber } from './common/utils'
import moment from 'moment'

// TODO: this should look for 5 minutes blocks and not 15 minutes

const positionId = (position: Position) => `[${position.pair}_${round(position.buy.price || 0, 4) }_${round(position.buy.volume || 0, 0)}]`

// Trailing Stop/Stop-Loss
export class TrailingStopLossBot {

  constructor(
    readonly kraken: KrakenService,
    readonly positionService: PositionsService,
    readonly profits: ProfitsRepo,
    readonly analyst: DownswingAnalyst,
    readonly config: BotConfig,
  ) {

    // load positions and start watching for sell opporunities
    this.positionService.findByStatus('open').then(positions => {
      const risk = positions.reduce((acc, position) => {
        if(position.buy.price && position.buy.volume) {
          logger.info(`Start watching sell opportunity for ${positionId(position)}`)
          return {
            costs: acc.costs + (position.buy.price * position.buy.volume),
            volume: acc.volume + position.buy.volume
          }
        }
        return acc
      }, { costs: 0, volume: 0 })
      logger.info(`Currently at risk: ${formatMoney(risk.costs)} $ (${formatNumber(risk.volume)} ADA)`)
    })

    if (analyst) {
      analyst.on(ANALYST_EVENTS.SELL, (data: SellRecommendation) => {
        this.handleSellRecommendation(data)
      })
    }
  }

  inWinZone(currentBidPrice: number, targetProfit: number, position: Position): boolean {
    if(position.buy.price && position.buy.volume) {
      const costs = position.buy.price * position.buy.volume
      const fee = costs * this.config.tax * 2
      const totalCosts = fee + costs
      const volumeToSell = round((totalCosts / currentBidPrice), 0)
      const expectedProfit = position.buy.volume - volumeToSell

      logger.debug(`Expected profit for ${positionId(position)}: ${expectedProfit}`)
      return expectedProfit > 0 && expectedProfit >= targetProfit
    }
    return false
  }

  async handleSellRecommendation(recommendation: SellRecommendation) {
    const currentBidPrice = await this.kraken.getBidPrice(recommendation.pair)
    const positions = await this.positionService.findByStatus('open')
    positions.forEach(async position => {
      if(this.inWinZone(currentBidPrice, this.config.targetProfit, position)) {
        logger.info(`Position ${positionId(position)} is in WIN zone. Sell now! 🤑`)
        await this.sellPosition(position, currentBidPrice)
        await this.evaluateProfit(position)
      }
      else {
        logger.info(`Unfortunately position ${positionId(position)} is not yet in WIN zone 🤬`)
      }
    })
  }

  async sellPosition(position: Position, currentBidPrice: number) {
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
        this.positionService.update(position, {
          'status': 'selling',
          'sell.volumeToKeep': volumeToKeep
        })

        // create SELL order with Kraken
        const orderIds = await this.kraken.createSellOrder({ pair: position.pair, volume: volumeToSell })
        logger.info(`Successfully created SELL order for ${positionId(position)}. orderIds: ${JSON.stringify(orderIds)}`)

        // mark position as sold and keep track of the orderIds
        await this.positionService.update(position, {
          'status': 'sold',
          'sell.orderId': orderIds.map(id => id.id)
        })
      }
      catch(err) {
        logger.error(`Error SELL ${positionId(position)}:`, err)
        logger.error(JSON.stringify(err))
      }
    }
  }

  async evaluateProfit(position: Position) {
    try {
      // TODO: what do we do if we got multiple orderIds?
      if(position.sell.orderIds && position.sell.orderIds.length > 0) {
        const orderId = position.sell.orderIds[0]
        const order = await this.kraken.getOrder({ id: orderId })

        if(order === undefined) {
          throw new Error(`SELL order '${JSON.stringify(orderId)}' returned 'undefined'. we need to fix this manally. Position ${positionId(position)}`)
        }

        // update position to keep track of profit
        const volumeSold = parseFloat(order.vol_exec) || 0
        const profit = (position.buy.volumeExecuted || 0) - volumeSold
        this.positionService.update(position, {
          'sell.price': parseFloat(order.price),
          'sell.volume': volumeSold,
          'sell.profit': profit
        })

        logger.info(`Successfully executed SELL order of ${round(order.vol_exec, 0)}/${round(order.vol_exec, 0)} for ${order.price}`)
        logger.debug(`SELL order: ${JSON.stringify(order)}`)

        await this.logProfit(order, position)
        await this.sendSlackMessage(position, order)
      }
    }
    catch(err) {
      logger.error(`Error evaluating profit for ${positionId(position)}:`, err)
    }
  }

  logProfit(order: any, position: Position) {
    this.profits.add({
      date: moment().format(),
      soldFor: parseFloat(order.price),
      volume: parseFloat(order.vol_exec),
      profit: position.sell.volumeToKeep || 0,
      position
    })
  }

  sendSlackMessage(position: Position, order: any) {
    const msg = `Successfully SOLD ${positionId(position)} volume ${round(order.vol_exec, 0)}/${round(order.vol_exec, 0)} for ${formatMoney(order.price)}`
    slack(this.config).send(msg)
  }
}
