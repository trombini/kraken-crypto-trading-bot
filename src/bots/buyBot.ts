import { BuyRecommendation } from '../common/interfaces/interfaces'
import { KrakenService } from '../kraken/krakenService'
import { logger } from '../common/logger'
import { filter, max, round } from 'lodash'
import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { PositionsService } from '../positions/positions.service'
import { slack } from '../slack/slack.service'
import { Analyst, ANALYST_EVENTS } from '../analysts/analyst'
import { Position } from '../positions/position.interface'
import { formatMoney } from '../common/utils'
import { DcaService } from 'src/common/dca'
import { LaunchDarklyService } from '../launchDarkly/launchdarkly.service'
import moment from 'moment'

/**
 * @param reserve Amount we want to hold as reserve
 * @param availableAmount Amount of money we have available on exchange
 * @param minBet Smallest possible bet
 * @param maxRisk Biggest possible bet
 * @param confidence Confidence in the market
 * @returns amount we are fine to invest
 */
export const calculateRisk = (
  reserveAmount: number,
  availableAmount: number,
  minBet: number,
  maxRisk: number,
  confidence: number,
): number => {
  logger.debug(`Calculate risk with availableAmount: ${round(availableAmount, 2)}, reserveAmount: ${reserveAmount}, maxRisk: ${maxRisk}`)

  const totalAvailabeFunds = availableAmount - reserveAmount

  if (totalAvailabeFunds < 0) {
    // TODO: remove
    logger.error(`totalAvailabeFunds (${round(totalAvailabeFunds, 2)}) is below zero. We want to keep reserve of: ${reserveAmount}`)
    throw new Error(`totalAvailabeFunds (${round(totalAvailabeFunds, 2)}) is below zero. We want to keep reserve of: ${reserveAmount}`)
  }

  // available funds is what ever is smaller. MaxRisk or 25% of the total available funds
  const availableFunds = maxRisk < totalAvailabeFunds * 0.25 ? maxRisk : totalAvailabeFunds * 0.25

  // The risk is the amount we are willing to bet in a single order
  // The risk is calculated on the availableFunds
  const risk = round(availableFunds * confidence, 2)

  // Risk is too low, it is not worth buying cosindering the exchange costs
  if (risk < minBet) {
    // TODO: remove
    logger.error(`risk (${round(risk, 2)}) is less than minBet (${minBet})`)
    throw new Error(`risk (${round(risk, 2)}) is less than minBet (${minBet})`)
  }

  // TODO: Improve
  logger.debug(`Calculated risk ${risk}`)

  return risk

  // if(risk < maxFunds) {
  //   return risk
  // }

  // if(risk > maxFunds) {
  //   logger.debug(`Cap total risk at 25% of available funds or maxRisk`)
  //   return maxFunds
  // }

  // return 0

  // // The risk is below all threshold we have set. We are good to go
  // if(risk < maxAvailableFundsInRelationToTotal && risk < maxRisk) {
  //   return risk
  // }

  // // Cap the risk based on what ever is smaller, maxRisk or maxAvailableFundsInRelationToTotal
  // logger.debug(`Cap total risk at 25% of available funds or maxRisk`)
  // return maxRisk < maxAvailableFundsInRelationToTotal ? maxRisk : maxAvailableFundsInRelationToTotal
}

export const caluclateVolume = (risk: number, lastAskPrice: number) => {
  return round(risk / lastAskPrice, 0)
}

export class BuyBot {
  cache: any[]
  watcher: AssetWatcher | undefined
  upswingAnalyst: Analyst | undefined

  constructor(
    readonly kraken: KrakenService,
    readonly positionsService: PositionsService,
    readonly analyst: Analyst,
    readonly dcaService: DcaService,
    readonly killswitch: LaunchDarklyService,
    readonly config: BotConfig,
  ) {
    this.cache = []
    if (this.analyst) {
      this.analyst.on(ANALYST_EVENTS.BUY, (recommendation: BuyRecommendation) => {
        this.handleBuyRecommendation(recommendation)
      })
    }
  }

  async handleBuyRecommendation(recommendation: BuyRecommendation): Promise<void> {
    // Make sure we don't buy if Killswitch is tripped

    if (await this.killswitch.tripped()) {
      logger.debug("Would like to buy but can' as KILLSWITCH is triggered.")
      slack(this.config).send(`I wanted to BUY at ${recommendation.lastPrice} but Killswitch is active.`)
      return
    }

    // TODO: that threshold is wrong. it should be PERIOD + MIN_MATURITY_OF_BLOCK
    const threshold = moment().subtract(23, 'm').unix()
    const recentTrades = filter(this.cache, (trade) => trade.date > threshold)
    if (recentTrades.length > 0) {
      logger.warn(`Won't buy ${recommendation.pair} as we just bought it X minutes ago.`)
      return
    } else {
      try {
        const { risk, volume } = await this.evaluateBuyRecommendation(recommendation)
        if (risk > 0 && volume > 0) {
          const position = await this.buy(recommendation.pair, recommendation.confidence, risk, volume)
          if (position) {
            await this.fetchOrderDetails(position)
            await this.dcaService.dcaOpenPositions()
          }
        }
      } catch (err) {
        logger.error(err)
      }
    }
  }

  async evaluateBuyRecommendation(recommendation: BuyRecommendation): Promise<{ risk: number; volume: number }> {
    const reserve = this.config.reserve
    const minBet = this.config.minBet
    const maxBet = this.config.maxBet
    const availableAmount = await this.kraken.balance()
    const lastAskPrice = await this.kraken.getAskPrice(recommendation.pair)

    try {
      const risk = calculateRisk(reserve, availableAmount, minBet, maxBet, recommendation.confidence)
      const volume = caluclateVolume(risk, lastAskPrice)
      return {
        risk,
        volume,
      }
    } catch (err) {
      return {
        risk: 0,
        volume: 0,
      }
    }
  }

  /**
   *
   * @param pair pair to buy
   * @param confidence the confidence we calculated
   * @param risk the amount of money we are willing to risk
   * @param volume the volume to buy
   */
  async buy(pair: string, confidence: number, risk: number, volume: number): Promise<Position | undefined> {
    logger.info(`Create BUY order. pair: ${pair}, confidence: ${confidence}, risk: ${formatMoney(risk)}, volume: ${volume}`)
    try {
      const orderIds = await this.kraken.createBuyOrder({ pair, volume })
      const position = await this.positionsService.create({
        pair,
        volume,
        orderIds: orderIds.map((id) => id.id),
      })

      // make sure we keep track of trade to that we don't buy it again right away
      this.cache.push({
        date: moment().unix(),
        pair,
      })

      // return latest version of the position
      return this.positionsService.findById(position.id)
    } catch (err) {
      logger.error(`Error BUY position`)
      logger.error(err)
    }
  }

  // async buyPosition(recommendation: BuyRecommendation): Promise<Position | null | undefined> {
  //   logger.debug(`Create new BUY order for ${recommendation.pair}`)

  //   try {
  //     // const reserve = this.config.reserve
  //     // const minBet = this.config.minBet
  //     // const maxBet = this.config.maxBet
  //     // const availableAmount = await this.kraken.balance()
  //     // const lastAskPrice = await this.kraken.getAskPrice(recommendation.pair)

  //     // const risk = calculateRisk(reserve, availableAmount, minBet, maxBet, recommendation.confidence)
  //     // const volume = caluclateVolume(risk, lastAskPrice)

  //     logger.info(`Create BUY order. confidence: ${recommendation.confidence}, risk: ${formatMoney(risk)}, volume: ${volume}`)

  //     const orderIds = await this.kraken.createBuyOrder({
  //       pair: recommendation.pair,
  //       volume,
  //     })
  //     const position = await this.positionsService.create({
  //       pair: recommendation.pair,
  //       volume: volume,
  //       orderIds: orderIds.map((id) => id.id),
  //     })

  //     // make sure we keep track of trade to that we don't buy it again right away
  //     this.datastore.push({
  //       date: moment().unix(),
  //       pair: recommendation.pair,
  //     })

  //     // return latest version of the position
  //     return this.positionsService.findById(position.id)
  //   } catch (err) {
  //     logger.error(`Error BUY position: ${err.message}`)
  //   }
  // }

  async fetchOrderDetails(position: Position) {
    try {
      logger.debug(`Fetch order details for orders '${position.buy.orderIds?.join(',')}'`)
      if (position.buy.orderIds && position.buy.orderIds.length > 0) {
        const orderId = position.buy.orderIds[0]
        const order = await this.kraken.getOrder({
          id: orderId,
        })
        logger.debug(`Fetch order details for order '${orderId}'`)

        if (order === undefined) {
          throw new Error(`BUY order '${JSON.stringify(orderId)}' returned 'undefined'. we need to fix this manally.`)
        }

        logger.debug(`Processed BUY order: ${JSON.stringify(order)}`)
        if (order.price === undefined || order.vol === undefined) {
          logger.error(`Order doesn't provide all the required information. We need to fix it manually in the positions.json for now.`)
        }

        // update position to watch for sell opportunity
        const volumeExecuted = parseFloat(order.vol_exec) || 0
        const price = parseFloat(order?.price) || 0
        const updatedPosition = await this.positionsService.update(position, {
          status: 'open',
          'buy.volume': volumeExecuted,
          'buy.price': price,
        })

        // make sure we let Slack know
        if (updatedPosition) {
          this.logSuccessfulExecution(updatedPosition)
        }
      }
    } catch (err) {
      logger.error(`Cannot fetch order details for BUY order: ${JSON.stringify(err)}`)
      slack(this.config).send(`Cannot fetch order details for BUY order: ${JSON.stringify(err)}`)
    }
  }

  logSuccessfulExecution(position: Position) {
    const msg = `BUY order created. volume: ${round(position.buy.volume || 0, 0)}, price: ${position.buy.price}`
    slack(this.config).send(msg)
    logger.info(msg)
  }
}
