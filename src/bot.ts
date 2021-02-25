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
    }
    else {
      return this.buy(recommendation)
    }
  }

  // TODO: limit order (can it be killed automatically?)
  // TODO: difference between input order and a "KrakenOrder" (ProcessedOrder?)
  // TODO: orders might not be completed right away. so we don't really know what the AVG price is
  async buy(recommendation: BuyRecommendation): Promise<any> {
    logger.info(`Create new BUY order for ${recommendation.pair}`)

    // determine correct buy order
    // TODO: make maxBet dependent on available balance. like only spend 30% of it OR maxBet
    const maxBet = this.config.maxBet
    const availableAmount = await this.kraken.balance()
    const lastAskPrice = await this.kraken.getAskPrice(recommendation.pair)
    const volume = caluclateVolume(availableAmount, maxBet, lastAskPrice)

    try {
      const position = await this.positionsService.create({ pair: 'ADAUSD', volume: volume })
      const orderIds = await this.kraken.createBuyOrder({ pair: recommendation.pair, volume })

      // make sure we keep track of trade to that we don't buy it again right away
      this.datastore.push({
        date: moment().unix(),
        pair: recommendation.pair,
        orderIds: orderIds
      })

      // load order details and log position
      return Promise.all(
        orderIds.map((orderId) => this.processOrderId(position, orderId))
      )
    }
    catch(err) {
      logger.error(err)
    }
  }

  // TODO: that order might be undefined, we need to handle this case to not have multiple buy orders for the same upswing
  async processOrderId(position: Position, orderId: OrderId) {
    try {
      const order = await this.kraken.getOrder(orderId)
      if(order === undefined) {
        throw new Error(`BUY order '${JSON.stringify(orderId)}' returned 'undefined'. we need to fix this manally.`)
      }

      logger.debug(`Processed BUY order: ${JSON.stringify(order)}`)
      if(order.price === undefined || order.vol === undefined) {
        logger.error(`Order doesn't provide all the required information. We need to fix it manually in the positions.json for now.`)
      }

      // update position to watch for sell opportunity
      this.positionsService.update(position, {
        status: 'open',
        volumeExecuted: order?.vol_exec ? parseFloat(order?.vol_exec) : 0,
        price: order?.price ? parseFloat(order?.price) : 0,
      })

      // make sure we let Slack know
      this.logSuccessfulExecution(order)
    }
    catch(err) {
      logger.error(err)
    }
  }

  logSuccessfulExecution(order: any) {
    const msg = `BUY order created. volume: ${round(order.vol, 0)}/${round(order.vol_exec, 0)}, price: ${order.price}, status: ${order.status}`
    slack(this.config).send(msg)
    logger.info(msg)
  }
}
