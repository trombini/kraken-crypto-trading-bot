import { Analyst } from './analyst'
import { BuyRecommendation, SellOrder, Trade } from './interfaces/trade.interface'
import { KrakenService } from './krakenService'
import { logger } from './common/logger'
import { round } from 'lodash'

const MAX_BET = 500

export const calculateExitStrategy = (expectedProfit: number, trade: Trade): SellOrder => {
  // TODO should TAX be configuration?
  const costs = trade.price * trade.volume
  const totalFee = costs * trade.tax * 2
  const sellVolume = trade.volume - expectedProfit
  const targetPrice =  (costs + totalFee) / sellVolume
  const roundedTargetPrice = round(targetPrice, 4)
  return {
    pair: trade.pair,
    volume: sellVolume,
    price: roundedTargetPrice
  }
}

export const caluclateVolume = (maxBet: number, price: number) => round(maxBet / price, 2)

export class Bot {

  datastore: any

  constructor(readonly kraken: KrakenService, readonly analyst?: Analyst) {
    // register event handler to observe buy recommendations
    if(analyst) {
      analyst.on('ANALYST:RECOMMENDATION_TO_BUY', (data: BuyRecommendation) => {
        this.buy(data)
      })
    }
  }

  buy(recommendation: BuyRecommendation) {
    return this.kraken.getAskPrice(recommendation.pair).then(price => {
      // TOOD: make MAX_BET configurable
      const volume = caluclateVolume(MAX_BET, price)
      return this.kraken.createBuyOrder({
        pair: recommendation.pair,
        volume
      }).then(trade => {
        const sell = calculateExitStrategy(50, trade)
        logger.debug(`Bought ${trade.volume} ADA for ${trade.price}$ (${trade.cost}$)`)
        logger.debug(`New SellOrder ${sell.volume} ADA for ${sell.price}$`)
        // console.log(trade)
        // console.log(sell)
      })
    })
  }
}
