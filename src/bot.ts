import { Analyst } from './analysts/analyst'
import { BuyRecommendation, SellOrder, Trade } from './interfaces/trade.interface'
import { KrakenService } from './krakenService'
import { logger } from './common/logger'
import { filter, round } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import { PositionsService } from './positions.service'

const MAX_BET = 1500

export const calculateExitStrategy = (
  expectedProfit: number,
  trade: Trade,
): SellOrder => {
  // TODO should TAX be configuration?
  const costs = trade.price * trade.volume
  const totalFee = costs * trade.tax * 2
  const sellVolume = trade.volume - expectedProfit
  const targetPrice = (costs + totalFee) / sellVolume
  const roundedTargetPrice = round(targetPrice, 4)
  return {
    pair: trade.pair,
    volume: sellVolume,
    price: roundedTargetPrice,
  }
}

export const caluclateVolume = (maxBet: number, price: number) => round(maxBet / price, 0)

export class Bot {
  datastore: any[]

  constructor(
    readonly kraken: KrakenService,
    readonly analyst: Analyst,
    readonly positionsService: PositionsService
  ) {
    this.datastore = []

    // register event handler to observe buy recommendations
    if (analyst) {
      analyst.on('ANALYST:RECOMMENDATION_TO_BUY', (data: BuyRecommendation) => {
        this.buy(data)
      })
    }
  }

  // TOOD: make MAX_BET configurable
  async buy(recommendation: BuyRecommendation) {
    const threshold = moment().subtract(15, 'm').unix()
    const recentTrades = filter(this.datastore, trade => trade.date > threshold)
    if (recentTrades.length > 0) {
      logger.info(`Won't buy ${recommendation.pair} as we just bought it X minutes ago.`)
      return
    }

    const askPrice = await this.kraken.getAskPrice(recommendation.pair)
    const volume = caluclateVolume(MAX_BET, askPrice)

    return this.kraken
      .createBuyOrder({ pair: recommendation.pair, volume })
      .then(transactions => {
        // make sure we keep track of the latest trade
        this.datastore.push({
          id: uuidv4(),
          date: moment().unix(),
          transactions
        })

        // const sell = calculateExitStrategy(50, trade)
        // logger.debug(`Bought ${trade.volume} ADA for ${trade.price}$ (${trade.cost}$)`)
        // logger.debug(`New SellOrder ${sell.volume} ADA for ${sell.price}$`)
      })
  }
}
