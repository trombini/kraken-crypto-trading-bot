import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { ANALYST_EVENTS } from './analysts/analyst'
import { OrderId, SellRecommendation } from './common/interfaces/trade.interface'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { BotConfig } from './common/config'
import { ProfitsRepo } from './profit/profit.repo'
import { slack } from './slack/slack.service'
import { round } from 'lodash'
import { BetsService } from './bets/bets.service'
import { IBet } from './bets/bet.model'
import moment from 'moment'

// TODO: this should look for 5 minutes blocks and not 15 minutes

const printBet = (bet: IBet) => `[${bet.pair}_${bet.price || 0}_${bet.volume || 0}]`

// Trailing Stop/Stop-Loss
export class TrailingStopLossBot {

  constructor(
    readonly kraken: KrakenService,
    readonly betService: BetsService,
    readonly profits: ProfitsRepo,
    readonly analyst: DownswingAnalyst,
    readonly config: BotConfig,
  ) {

    // load positions and start watching for sell opporunities
    this.betService.findByStatus('open').then(bets => {
      const risk = bets.reduce((acc, bet) => {
        if(bet.price && bet.volume) {
          logger.info(`Start watching sell opportunity for ${printBet(bet)}`)
          return {
            costs: acc.costs + (bet.price * bet.volume),
            volume: acc.volume + bet.volume
          }
        }
        return acc
      }, { costs: 0, volume: 0 })
      logger.info(`Currently at risk: ${round(risk.costs, 0)} $ (${risk.volume} ADA)`)
    })

    if (analyst) {
      analyst.on(ANALYST_EVENTS.SELL, (data: SellRecommendation) => {
        this.handleSellRecommendation(data)
      })
    }
  }

  inWinZone(currentBidPrice: number, targetProfit: number, bet: IBet): boolean {
    if(bet.price && bet.volume) {
      const costs = bet.price * bet.volume
      const fee = costs * this.config.tax * 2
      const totalCosts = fee + costs
      const volumeToSell = round((totalCosts / currentBidPrice), 0)
      const expectedProfit = bet.volume - volumeToSell

      logger.debug(`Expected profit for ${printBet(bet)}: ${expectedProfit}`)
      return expectedProfit > 0 && expectedProfit >= targetProfit
    }
    return false
  }

  async handleSellRecommendation(recommendation: SellRecommendation) {
    const currentBidPrice = await this.kraken.getBidPrice(recommendation.pair)
    const bets = await this.betService.findByStatus('open')
    bets.forEach(bet => {
      if(this.inWinZone(currentBidPrice, this.config.targetProfit, bet)) {
        logger.info(`Position ${printBet(bet)} is in WIN zone. Sell now! 🤑`)
        this.sellPosition(bet, currentBidPrice)
      }
      else {
        logger.info(`Unfortunately position ${printBet(bet)} is not yet in WIN zone 🤬`)
      }
    })
  }

  async sellPosition(bet: IBet, currentBidPrice: number) {
    if(bet.price && bet.volume) {
      const costs = bet.price * bet.volume
      const fee = costs * this.config.tax * 2
      const totalCosts = fee + costs
      const volumeToSell = round((totalCosts / currentBidPrice), 0)
      const volumeToKeep = bet.volume - volumeToSell

      if(volumeToKeep < 0) {
        throw Error(`Expected profit for ${printBet(bet)} would be negative. Stop the sell!`)
      }

      try {
        logger.info(`Create SELL order for ${printBet(bet)}. volume: ${volumeToSell}, price: ~ ${currentBidPrice}, keep: ${volumeToKeep}`)

        // update the status of the Bet so that we don't end up selling it multiple times
        this.betService.update(bet, { status: 'processing' })

        // create order with Kraken
        const orderIds = await this.kraken.createSellOrder({ pair: bet.pair, volume: volumeToSell })
        logger.debug(`Successfully created SELL order for ${printBet(bet)}. orderIds: ${JSON.stringify(orderIds)}`)

        // try to fetch details of the KrakenOrder and log profit
        return Promise.all(
          orderIds.map((orderId) => this.evaluateProfits(bet, volumeToKeep, orderId))
        )
      }
      catch(err) {
        logger.error(`Error ${printBet(bet)}:`, err)
      }
    }
  }

  async evaluateProfits(bet: IBet, volumeToKeep: number, orderId: OrderId) {
    try {
      const order = await this.kraken.getOrder(orderId)

      if(order === undefined) {
        throw new Error(`SELL order '${orderId}' returned 'undefined'. we need to fix this manally. Position ${printBet(bet)}`)
      }

      logger.info(`Successfully executed SELL order of ${round(order.vol_exec, 0)}/${round(order.vol_exec, 0)} for ${order.price}`)
      logger.debug(`SELL order: ${JSON.stringify(order)}`)

      // update the status of the Bet so that we don't end up selling it multiple times
      this.betService.update(bet, { status: 'closed' })
      this.logProfit(order, bet, volumeToKeep)
      this.sendSlackMessage(order)
    }
    catch(err) {
      logger.error(`Error ${printBet(bet)}:`, err)
    }
  }

  logProfit(order: any, bet: IBet, volumeToKeep: number) {
    this.profits.add({
      date: moment().format(),
      soldFor: parseFloat(order.price),
      volume: parseFloat(order.vol_exec),
      profit: volumeToKeep,
      bet
    })
  }

  sendSlackMessage(order: any) {
    const msg = `Successfully executed SELL order of ${round(order.vol_exec, 0)}/${round(order.vol_exec, 0)} for ${order.price}`
    slack(this.config).send(msg)
  }
}
