import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { Position, SellRecommendation } from './interfaces/trade.interface'
import { KrakenService } from './krakenService'
import { logger } from './common/logger'
import { BotConfig } from './common/config'
import { round } from 'lodash'
import { PositionsService } from './positions.service'

// TODO: this should look for 5 minutes blocks and not 15 minutes

const positionIdentifier = (position: Position) => ``

// Trailing Stop/Stop-Loss
export class TrailingStopLossBot {

  constructor(
    readonly kraken: KrakenService,
    readonly analyst: DownswingAnalyst,
    readonly config: BotConfig,
    readonly repo: PositionsService
  ) {
    // load positions and start watching for sell opporunities
    this.repo.findAll().then(positions => {
      positions.map(position => {
        const key = `[${position.pair}_${position.price}_${position.volume}]`
        logger.info(`Start watching sell opportunity for ${key}`)
      })
    })

    // register event handler to observe SELL recommendations
    if (analyst) {
      analyst.on('ANALYST:RECOMMENDATION_TO_SELL', (data: SellRecommendation) => {
        this.handleSellRecommendation(data)
      })
    }
  }

  inBuyZone(currentBidPrice: number, targetProfit: number, position: Position): boolean {
    const costs = position.price * position.volume
    const fee = costs * this.config.tax * 2
    const totalCosts = fee + costs
    const volumeToSell = round((totalCosts / currentBidPrice), 0)
    const expectedProfit = position.volume - volumeToSell

    return expectedProfit > 0 && expectedProfit >= targetProfit
  }

  async handleSellRecommendation(recommendation: SellRecommendation) {
    const targetProfit = 50
    const currentBidPrice = await this.kraken.getBidPrice(recommendation.pair)

    this.repo.findAll().then(positions => {
      positions.forEach(position => {
        if(this.inBuyZone(currentBidPrice, targetProfit, position)) {
          this.sell(position, currentBidPrice)
        }
        else {
          logger.info(`Unfortunately position '${positionIdentifier(position)}' is not yet in WIN zone 🤬`)
        }
      })
    })
  }

  async sell(position: Position, currentBidPrice: number) {
    logger.info(`Position '${positionIdentifier(position)}' is in WIN zone. Sell now! 🤑`)

    const costs = position.price * position.volume
    const fee = costs * this.config.tax * 2
    const totalCosts = fee + costs
    const volumeToSell = round((totalCosts / currentBidPrice), 0)
    const volumeToKeep = position.volume - volumeToSell

    logger.info(`Create SELL for ${volumeToSell} '${position.pair}' for ~ ${currentBidPrice}. Keep ${volumeToKeep}`)

    // TODO: calculate real profit based on actual transaction data
  }
}
