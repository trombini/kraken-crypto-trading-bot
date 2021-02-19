import { Analyst } from './analysts/analyst'
import { BuyRecommendation, Order } from './interfaces/trade.interface'
import { KrakenService } from './krakenService'
import { logger } from './common/logger'
import { filter, round } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { PositionsService } from './positions.service'
import { BotConfig } from './common/config'
import moment from 'moment'

// export const calculateExitStrategy = (expectedProfit: number, trade: Trade): Order => {
//   // TODO should TAX be configuration?
//   const costs = trade.price * trade.volume
//   const totalFee = costs * trade.tax * 2
//   const sellVolume = trade.volume - expectedProfit
//   const targetPrice = (costs + totalFee) / sellVolume
//   const roundedTargetPrice = round(targetPrice, 4)
//   return {
//     pair: trade.pair,
//     volume: sellVolume,
//     price: roundedTargetPrice,
//   }
// }

export const caluclateVolume = (maxBet: number, price: number) => round(maxBet / price, 0)

export class Bot {
  datastore: any[]

  constructor(
    readonly kraken: KrakenService,
    readonly analyst: Analyst,
    readonly positionsService: PositionsService,
    readonly config: BotConfig
  ) {
    this.datastore = []

    // TODO: should the bot be in charge of initiating the analysts? There might be multiple signals that need to be combined
    // TODO: keep track here to keep track of all analysts to determine if they might have different oppinions

    // register event handler to observe buy recommendations
    if (analyst) {
      analyst.on('ANALYST:RECOMMENDATION_TO_BUY', (recommendation: BuyRecommendation) => {
        this.handleBuyRecommendation(recommendation)
      })
    }
  }

  async handleBuyRecommendation(recommendation: BuyRecommendation): Promise<any> {
    const threshold = moment().subtract(15, 'm').unix()
    const recentTrades = filter(this.datastore, trade => trade.date > threshold)
    if (recentTrades.length > 0) {
      logger.info(`Won't buy ${recommendation.pair} as we just bought it X minutes ago.`)
    }
    else {
      return this.buy(recommendation)
    }
  }

  // TODO: difference between input order and a "KrakenOrder" (ProcessedOrder?)
  // TODO: orders might not be completed right away. so we don't really know what the AVG price is
  async buy(recommendation: BuyRecommendation): Promise<any> {

    // execute order
    const askPrice = await this.kraken.getAskPrice(recommendation.pair)
    const volume = caluclateVolume(this.config.maxBet, askPrice)

    const orderIds = await this.kraken.createBuyOrder({ pair: recommendation.pair, volume })
    const orders = await Promise.all(orderIds.map(order => this.kraken.getOrder(order)))
    orders.forEach(order => {
      logger.info(`Order [${recommendation.pair}], volume: ${order.vol}/${order.vol_exec}, price: ${order.price}, status: ${order.status}`)

      // register position to watch for sell opportunity
      this.positionsService.add({
        id: moment().unix(),
        pair: recommendation.pair,
        price: parseFloat(order.price),
        volume: parseFloat(order.vol_exec),
        tax: 0.0018
      })
    })

    // make sure we keep track of trade to that we don't buy it again right away
    this.datastore.push({
      date: moment().unix(),
      pair: recommendation.pair
    })

    return orders
  }
}
