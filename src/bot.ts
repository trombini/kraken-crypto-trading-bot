import { BuyRecommendation, OrderId } from './common/interfaces/trade.interface'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { filter, round } from 'lodash'
import { PositionsService } from './positions/positions.repo'
import { BotConfig } from './common/config'
import { BetsService } from './bets/bets.service'
import { slack } from './slack/slack.service'
import { AssetWatcher } from './assetWatcher'
import { ANALYST_EVENTS } from './analysts/analyst'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import moment from 'moment'
import { IBet } from './bets/bet.model'


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
    readonly betService: BetsService,
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
    const threshold = moment().subtract(20, 'm').unix()
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
      const bet = await this.betService.create({ pair: 'ADAUSD', volume: volume })
      const orderIds = await this.kraken.createBuyOrder({ pair: recommendation.pair, volume })

      // make sure we keep track of trade to that we don't buy it again right away
      this.datastore.push({
        date: moment().unix(),
        pair: recommendation.pair,
        orderIds: orderIds
      })

      // load order details and log position
      return Promise.all(
        orderIds.map((orderId) => this.processOrderId(bet, orderId))
      )
    }
    catch(err) {
      logger.error(err)
    }
  }

  // TODO: that order might be undefined, we need to handle this case to not have multiple buy orders for the same upswing
  async processOrderId(bet: IBet, orderId: OrderId) {
    try {
      const order = await this.kraken.getOrder(orderId)
      if(order === undefined) {
        throw new Error(`BUY order '${orderId}' returned 'undefined'. we need to fix this manally.`)
      }

      logger.debug(`Processed BUY order: ${JSON.stringify(order)}`)
      if(order.price === undefined || order.vol === undefined) {
        logger.error(`Order doesn't provide all the required information. We need to fix it manually in the positions.json for now.`)
      }

      // update bet to watch for sell opportunity
      this.betService.update(bet, {
        status: 'open',
        volumeExecuted: order?.vol_exec ? parseFloat(order?.vol_exec) : 0,
        price: order?.price ? parseFloat(order?.price) : 0,
      })

      // register position to watch for sell opportunity
      await this.positionsService.add({
        id: moment().format(),
        pair: 'ADAUSD',
        price: order?.price ? parseFloat(order?.price) : 0,
        volume: order?.vol_exec ? parseFloat(order?.vol_exec) : 0,
      })

      // make sure we let Slack know
      this.logSuccessfulExecution(order)
    }
    catch(err) {
      logger.error(err)
    }
  }

  logSuccessfulExecution(order: any) {
    const msg = `Order created. volume: ${order.vol}/${order.vol_exec}, price: ${order.price}, status: ${order.status}`
    slack(this.config).send(msg)
    logger.info(msg)
  }
}
