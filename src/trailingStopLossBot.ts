import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { ANALYST_EVENTS } from './analysts/analyst'
import { OrderId, SellRecommendation } from './common/interfaces/trade.interface'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { BotConfig } from './common/config'
import { PositionsService } from './positions/positions.repo'
import { Position } from './positions/position.interface'
import { ProfitsRepo } from './profit/profit.repo'
import { slack } from './slack/slack.service'
import { round } from 'lodash'
import { BetsService } from './bets/bets.service'
import { IBet } from './bets/bet.model'
import moment from 'moment'

// TODO: this should look for 5 minutes blocks and not 15 minutes

const positionIdentifier = (position: Position) => `${position.pair}_${position.price}_${position.volume}`
const printBet = (bet: IBet) => `[${bet.pair}_${bet.price || 0}_${bet.volume || 0}]`

// Trailing Stop/Stop-Loss
export class TrailingStopLossBot {

  constructor(
    readonly kraken: KrakenService,
    readonly betService: BetsService,
    readonly positions: PositionsService,
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





    // load positions and start watching for sell opporunities
    this.positions.findAll().then(positions => {
      const risk = positions.reduce((acc, position) => {
        logger.info(`Start watching sell opportunity for ${positionIdentifier(position)}`)
        return {
          costs: acc.costs + (position.price * position.volume),
          volume: acc.volume + position.volume
        }
      }, { costs: 0, volume: 0 })

      logger.info(`Currently at risk: ${round(risk.costs, 0)} $ (${risk.volume} ADA)`)
    })



    

    // const watcher = new AssetWatcher(5, kraken, config)
    // const analyst = new DownswingAnalyst(watcher, config)
    if (analyst) {
      analyst.on(ANALYST_EVENTS.SELL, (data: SellRecommendation) => {
        this.handleSellRecommendation(data)
      })
    }
  }

  inWinZone(currentBidPrice: number, targetProfit: number, position: Position): boolean {
    const costs = position.price * position.volume
    const fee = costs * this.config.tax * 2
    const totalCosts = fee + costs
    const volumeToSell = round((totalCosts / currentBidPrice), 0)
    const expectedProfit = position.volume - volumeToSell

    logger.debug(`Expected profit for [${positionIdentifier(position)}]: ${expectedProfit}`)

    return expectedProfit > 0 && expectedProfit >= targetProfit
  }

  async handleSellRecommendation(recommendation: SellRecommendation) {
    const currentBidPrice = await this.kraken.getBidPrice(recommendation.pair)
    const positions = await this.positions.findAll()
    positions.forEach(position => {
      if(this.inWinZone(currentBidPrice, this.config.targetProfit, position)) {
        logger.info(`Position [${positionIdentifier(position)}] is in WIN zone. Sell now! 🤑`)
        this.sellPosition(position, currentBidPrice)
      }
      else {
        logger.info(`Unfortunately position [${positionIdentifier(position)}] is not yet in WIN zone 🤬`)
      }
    })
  }

  // TODO: find better place for this
  async validatePosition(position: Position) {
    if(position.price === 0 || position.volume === 0) {
      logger.error(`Position broken`)
      return false
    }
    return true
  }

  async sellPosition(position: Position, currentBidPrice: number) {
    if(this.validatePosition(position)) {
      const costs = position.price * position.volume
      const fee = costs * this.config.tax * 2
      const totalCosts = fee + costs
      const volumeToSell = round((totalCosts / currentBidPrice), 0)
      const volumeToKeep = position.volume - volumeToSell

      if(volumeToKeep < 0) {
        throw Error(`Expected profit for position [${positionIdentifier(position)}] would be negative. Stop the sell!`)
      }

      try {
        logger.info(`Create SELL order for [${positionIdentifier(position)}]. volume: ${volumeToSell}, price: ~ ${currentBidPrice}, keep: ${volumeToKeep}`)

        // do this before we trigger the order. if it fails we don't sell it twice
        logger.debug(`Remove position so that we don't over sell: ${JSON.stringify(position)}`)
        this.positions.delete(position)

        const orderIds = await this.kraken.createSellOrder({ pair: position.pair, volume: volumeToSell })
        logger.debug(`Successfully created SELL order for [${positionIdentifier(position)}]. orderIds: ${JSON.stringify(orderIds)}`)

        // load order details and log position
        return Promise.all(
          orderIds.map((orderId) => this.evaluateProfits(position, volumeToKeep, orderId))
        )
      }
      catch(err) {
        logger.error(`Error [${positionIdentifier(position)}]`)
        logger.error(err)
      }
    }
  }

  async evaluateProfits(position: Position, volumeToKeep: number, orderId: OrderId) {
    try {
      const order = await this.kraken.getOrder(orderId)
      if(order === undefined) {
        throw new Error(`SELL order '${orderId}' returned 'undefined'. we need to fix this manally. Position (${positionIdentifier(position)})`)
      }

      logger.debug(`SELL order: ${JSON.stringify(order)}`)
      this.profits.add({
        date: moment().format(),
        soldFor: parseFloat(order.price),
        volume: parseFloat(order.vol_exec),
        profit: volumeToKeep,
        position
      })

      this.logSuccessfulExecution(order)
    }
    catch(err) {
      logger.error(`Error [${positionIdentifier(position)}]`)
      logger.error(err)
    }
  }

  logSuccessfulExecution(order: any) {
    const msg = `Successfully executed SELL order of ${round(order.vol_exec, 0)}/${round(order.vol_exec, 0)} for ${order.price}`
    slack(this.config).send(msg)
    logger.info(msg)
  }
}
