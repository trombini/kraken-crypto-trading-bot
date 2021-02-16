import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { Position, SellRecommendation } from './interfaces/trade.interface'
import { KrakenService } from './krakenService'
import { logger } from './common/logger'
import { BotConfig } from './common/config'
import { round } from 'lodash'
import fs from 'fs'

// TODO: this should look for 5 minutes blocks and not 15 minutes

// Trailing Stop/Stop-Loss
export class TrailingStopLossBot {

  repo: PositionsRepository

  constructor(readonly kraken: KrakenService, readonly analyst: DownswingAnalyst, readonly config: BotConfig) {

    this.repo = new PositionsRepository()

    this.repo.positions().then(positions => {
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
    logger.debug(`Current BID price for ${recommendation.pair} is '${currentBidPrice}'`)

    this.repo.positions().then(positions => {
      positions.forEach(position => {
        if(this.inBuyZone(currentBidPrice, targetProfit, position)) {
          this.sell(position, currentBidPrice)
        }
      })
    })
  }

  async sell(position: Position, currentBidPrice: number) {

    const key = `[${position.pair}_${position.price}_${position.volume}]`
    logger.info(`Position '${key}' is in WIN zone. Sell now! 🤑`)

    const costs = position.price * position.volume
    const fee = costs * this.config.tax * 2
    const totalCosts = fee + costs
    const volumeToSell = round((totalCosts / currentBidPrice), 0)
    const volumeToKeep = position.volume - volumeToSell

    logger.debug(`Create SELL for ${volumeToSell} '${position.pair}' for ~ ${currentBidPrice}. Keep ${volumeToKeep}`)

    // TODO: calculate real profit based on actual transaction data
  }
}

class PositionsRepository {

  data: any[]

  constructor() {
    this.data = []
    this.loadDataFromDisk().then(positions => {
      this.data = positions
    })
  }

  async positions() {
    return this.loadDataFromDisk().then(positions => {
      return positions
    })
  }

  async loadDataFromDisk(): Promise<Position[]> {

    return new Promise((resolve) => {
      const path = './positions.json'
      fs.access(path, (err) => {
        if(err) {
          fs.writeFile(path, JSON.stringify([]), (err) => {
            resolve([])
          })
        }
        else {
          fs.readFile(path, 'utf8', (err, data) => {
            resolve(JSON.parse(data))
          })
        }
      })
    })
  }
}
