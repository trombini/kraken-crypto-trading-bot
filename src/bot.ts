import { Analyst } from './analyst'
import { BuyOrder, BuyRecommendation, SellOrder, Trade } from './interfaces/trade.interface'
import { KrakenService } from './krakenService'
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

export class Bot {

  datastore: any

  constructor(readonly kraken: KrakenService, readonly analyst: Analyst) {
    // register event handler to observe buy recommendations
    analyst.on('ANALYST:RECOMMENDATION_TO_BUY', (data: BuyRecommendation) => {
      this.buy(data)
    })
  }

  buy(recommendation: BuyRecommendation) {
    const volume = round(MAX_BET / recommendation.lastPrice, 2)
    return this.kraken.buy({
      pair: recommendation.pair,
      idealPrice: recommendation.lastPrice,
      volume
    }).then(trade => {
      const sell = calculateExitStrategy(50, trade)

      console.log(`Bought ${trade.volume} ADA for ${trade.price}$ (${trade.cost}$)`)
      console.log(`New SellOrder ${sell.volume} ADA for ${sell.price}$`)
      // console.log(trade)
      // console.log(sell)
    })
  }
}
