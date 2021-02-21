import { BuyRecommendation } from './common/interfaces/trade.interface'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { filter, round } from 'lodash'
import { PositionsService } from './positions/positions.repo'
import { BotConfig } from './common/config'
import { slack } from './slack/slack.service'
import { AssetWatcher } from './assetWatcher'
import { ANALYST_EVENTS } from './analysts/analyst'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import moment from 'moment'

export const caluclateVolume = (maxBet: number, price: number) => round(maxBet / price, 0)

export class Bot {
  datastore: any[]

  constructor(
    readonly kraken: KrakenService,
    readonly positionsService: PositionsService,
    readonly config: BotConfig
  ) {
    this.datastore = []

    // TODO: should the bot be in charge of initiating the analysts? There might be multiple signals that need to be combined
    // TODO: keep track here to keep track of all analysts to determine if they might have different oppinions

    const watcher = new AssetWatcher(15, kraken, config)
    const upswingAnalyst = new UpswingAnalyst(watcher, config)
    if(upswingAnalyst) {
      upswingAnalyst.on(ANALYST_EVENTS.BUY, (recommendation: BuyRecommendation) => {
        this.handleBuyRecommendation(recommendation)
      })
    }
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
    const askPrice = await this.kraken.getAskPrice(recommendation.pair)
    const volume = caluclateVolume(this.config.maxBet, askPrice)

    try {
      // execute order
      const orderIds = await this.kraken.createBuyOrder({ pair: recommendation.pair, volume })
      const orders = await Promise.all(orderIds.map(orderId => this.kraken.getOrder(orderId)))
      orders.forEach(order => {
        // register position to watch for sell opportunity
        this.positionsService.add({
          id: moment().format(),
          pair: recommendation.pair,
          price: parseFloat(order.price),
          volume: parseFloat(order.vol_exec),
        })

        this.logSuccessfulExecution(order)
      })

      // make sure we keep track of trade to that we don't buy it again right away
      this.datastore.push({
        date: moment().unix(),
        pair: recommendation.pair
      })
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
