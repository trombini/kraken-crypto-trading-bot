import { BuyRecommendation, OrderId } from './common/interfaces/trade.interface'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { filter, round } from 'lodash'
import { BotConfig } from './common/config'
import { PositionsService } from './positions/positions.service'
import { slack } from './slack/slack.service'
import { AssetWatcher } from './assetWatcher'
import { ANALYST_EVENTS } from './analysts/analyst'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { Position } from './positions/position.interface'
import moment from 'moment'

// TODO: combine results of different AssetWatchers like 15 Min upswing + 5 min uptrend

// TODO: write test for this availableCurrency
export const calculateRisk = (availableAmount: number, maxBet: number): number => {
  if(availableAmount < maxBet) {
    logger.debug(`availableAmount is only ${availableAmount} and less than maxBet (${maxBet})`)
    return availableAmount < 1000 ? 0 : availableAmount
  }
  return maxBet
}

export const caluclateVolume = (availableAmount: number, maxBet: number, lastAskPrice: number) => {
  return round(calculateRisk(availableAmount, maxBet) / lastAskPrice, 0)
}

export class Bot {
  datastore: any[]
  watcher: AssetWatcher | undefined
  upswingAnalyst: UpswingAnalyst | undefined

  constructor(
    readonly kraken: KrakenService,
    readonly positionsService: PositionsService,
    readonly analyst: UpswingAnalyst,
    readonly config: BotConfig
  ) {
    this.datastore = []

    if(this.analyst) {
      this.analyst.on(ANALYST_EVENTS.BUY, (recommendation: BuyRecommendation) => {
        this.handleBuyRecommendation(recommendation)
      })
    }
    // TODO: should the bot be in charge of initiating the analysts? There might be multiple signals that need to be combined
    // TODO: keep track here to keep track of all analysts to determine if they might have different oppinions
  }

  async handleBuyRecommendation(recommendation: BuyRecommendation): Promise<any> {
    // TODO: that threshold is wrong. it should be PERIOD + MIN_MATURITY_OF_BLOCK
    const threshold = moment().subtract(23, 'm').unix()
    const recentTrades = filter(this.datastore, trade => trade.date > threshold)
    if (recentTrades.length > 0) {
      logger.info(`Won't buy ${recommendation.pair} as we just bought it X minutes ago.`)
      return
    }
    else {
      const position = await this.buyPosition(recommendation)
      if(position) {
        logger.debug('Good, now fetch Position details')
        await this.fetchOrderDetails(position)
        return position
      }
    }
  }

  // TODO: limit order (can it be killed automatically?)
  // TODO: difference between input order and a "KrakenOrder" (ProcessedOrder?)
  // TODO: orders might not be completed right away. so we don't really know what the AVG price is
  async buyPosition(recommendation: BuyRecommendation): Promise<Position | undefined> {
    logger.info(`Create new BUY order for ${recommendation.pair}`)

    // determine correct buy order
    // TODO: make maxBet dependent on available balance. like only spend 30% of it OR maxBet
    const maxBet = this.config.maxBet
    const availableAmount = await this.kraken.balance()
    const lastAskPrice = await this.kraken.getAskPrice(recommendation.pair)
    const volume = caluclateVolume(availableAmount, maxBet, lastAskPrice)

    try {
      const orderIds = await this.kraken.createBuyOrder({ pair: recommendation.pair, volume })
      const position = await this.positionsService.create({
        pair: recommendation.pair,
        volume: volume,
        orderIds: orderIds.map(id => id.id)
      })

      // make sure we keep track of trade to that we don't buy it again right away
      this.datastore.push({
        date: moment().unix(),
        pair: recommendation.pair,
      })

      return position
    }
    catch(err) {
      logger.error(`Error BUY position: `, err)
      logger.error(JSON.stringify(err))
    }
  }

  // TODO: that order might be undefined, we need to handle this case to not have multiple buy orders for the same upswing
  // TODO: what do we do if we got multiple orderIds?
  async fetchOrderDetails(position: Position) {
    try {
      logger.debug(`Fetch order details for orders '${position.buy.orderIds?.join(',')}'`)
       if(position.buy.orderIds && position.buy.orderIds.length > 0) {

        const orderId = position.buy.orderIds[0]
        const order = await this.kraken.getOrder({ id: orderId })
        logger.debug(`Fetch order details for order '${orderId}'`)

        if(order === undefined) {
          throw new Error(`BUY order '${JSON.stringify(orderId)}' returned 'undefined'. we need to fix this manally.`)
        }

        logger.debug(`Processed BUY order: ${JSON.stringify(order)}`)
        if(order.price === undefined || order.vol === undefined) {
          logger.error(`Order doesn't provide all the required information. We need to fix it manually in the positions.json for now.`)
        }

        // update position to watch for sell opportunity
        const volumeExecuted = parseFloat(order.vol_exec) || 0
        const price = parseFloat(order?.price) || 0
        await this.positionsService.update(position, {
          status: 'open',
          'buy.volume': volumeExecuted,
          'buy.volumeExecuted': volumeExecuted,
          'buy.price': price,
        })

        // make sure we let Slack know
        this.logSuccessfulExecution(position)
      }
    }
    catch(err) {
      logger.error(`Error BUY position: `, err)
      logger.error(JSON.stringify(err))
    }
  }

  logSuccessfulExecution(position: Position) {
    const msg = `BUY order created. volume: ${round(position.buy.volume || 0, 0)}, price: ${position.buy.price}`
    slack(this.config).send(msg)
    logger.info(msg)
  }
}
