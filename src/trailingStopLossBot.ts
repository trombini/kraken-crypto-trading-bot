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
import { formatCurrency, formatNumber } from './common/utils'
import moment from 'moment'

// TODO: this should look for 5 minutes blocks and not 15 minutes

const printposition = (position: Position) => `[${position.pair}_${position.price || 0}_${position.volume || 0}]`

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
        if(position.price && position.volume) {
          logger.info(`Start watching sell opportunity for ${printposition(position)}`)
          return {
            costs: acc.costs + (position.price * position.volume),
            volume: acc.volume + position.volume
          }
        }
        return acc
      }, { costs: 0, volume: 0 })
      logger.info(`Currently at risk: ${formatCurrency(risk.costs)} $ (${formatNumber(risk.volume)} ADA)`)
    })

    if (analyst) {
      analyst.on(ANALYST_EVENTS.SELL, (data: SellRecommendation) => {
        this.handleSellRecommendation(data)
      })
    }
  }

  inWinZone(currentBidPrice: number, targetProfit: number, position: Position): boolean {
    if(position.price && position.volume) {
      const costs = position.price * position.volume
      const fee = costs * this.config.tax * 2
      const totalCosts = fee + costs
      const volumeToSell = round((totalCosts / currentBidPrice), 0)
      const expectedProfit = position.volume - volumeToSell

      logger.debug(`Expected profit for ${printposition(position)}: ${expectedProfit}`)
      return expectedProfit > 0 && expectedProfit >= targetProfit
    }
    return false
  }

  async handleSellRecommendation(recommendation: SellRecommendation) {
    const currentBidPrice = await this.kraken.getBidPrice(recommendation.pair)
    const positions = await this.positionService.findByStatus('open')
    positions.forEach(position => {
      if(this.inWinZone(currentBidPrice, this.config.targetProfit, position)) {
        logger.info(`Position ${printposition(position)} is in WIN zone. Sell now! 🤑`)
        this.sellPosition(position, currentBidPrice)
      }
      else {
        logger.info(`Unfortunately position ${printposition(position)} is not yet in WIN zone 🤬`)
      }
    })
  }

  async sellPosition(position: Position, currentBidPrice: number) {
    if(position.price && position.volume) {
      const costs = position.price * position.volume
      const fee = costs * this.config.tax * 2
      const totalCosts = fee + costs
      const volumeToSell = round((totalCosts / currentBidPrice), 0)
      const volumeToKeep = position.volume - volumeToSell

      if(volumeToKeep < 0) {
        throw Error(`Expected profit for ${printposition(position)} would be negative. Stop the sell!`)
      }

      try {
        logger.info(`Create SELL order for ${printposition(position)}. volume: ${volumeToSell}, price: ~ ${currentBidPrice}, keep: ${volumeToKeep}`)

        // update the status of the position so that we don't end up selling it multiple times
        this.positionService.update(position, { status: 'processing' })

        // create order with Kraken
        const orderIds = await this.kraken.createSellOrder({ pair: position.pair, volume: volumeToSell })
        logger.debug(`Successfully created SELL order for ${printposition(position)}. orderIds: ${JSON.stringify(orderIds)}`)

        // try to fetch details of the KrakenOrder and log profit
        return Promise.all(
          orderIds.map((orderId) => this.evaluateProfits(position, volumeToKeep, orderId))
        )
      }
      catch(err) {
        logger.error(`Error ${printposition(position)}:`, err)
      }
    }
  }

  async evaluateProfits(position: Position, volumeToKeep: number, orderId: OrderId) {
    try {
      const order = await this.kraken.getOrder(orderId)

      if(order === undefined) {
        throw new Error(`SELL order '${JSON.stringify(orderId)}' returned 'undefined'. we need to fix this manally. Position ${printposition(position)}`)
      }

      logger.info(`Successfully executed SELL order of ${round(order.vol_exec, 0)}/${round(order.vol_exec, 0)} for ${order.price}`)
      logger.debug(`SELL order: ${JSON.stringify(order)}`)

      // update the status of the position so that we don't end up selling it multiple times
      this.positionService.update(position, { status: 'closed' })
      this.logProfit(order, position, volumeToKeep)
      this.sendSlackMessage(order)
    }
    catch(err) {
      logger.error(`Error ${printposition(position)}:`, err)
    }
  }

  logProfit(order: any, position: Position, volumeToKeep: number) {
    this.profits.add({
      date: moment().format(),
      soldFor: parseFloat(order.price),
      volume: parseFloat(order.vol_exec),
      profit: volumeToKeep,
      position
    })
  }

  sendSlackMessage(order: any) {
    const msg = `Successfully executed SELL order of ${round(order.vol_exec, 0)}/${round(order.vol_exec, 0)} for ${order.price}`
    slack(this.config).send(msg)
  }
}
