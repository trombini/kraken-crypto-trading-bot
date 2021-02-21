import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { SellRecommendation } from './common/interfaces/trade.interface'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { BotConfig } from './common/config'
import { round } from 'lodash'
import { PositionsService } from './positions/positions.repo'
import { Position } from './positions/position.interface'
import { ProfitsRepo } from './profit/profit.repo'
import { slack } from './slack/slack.service'
import { AssetWatcher } from './assetWatcher'
import moment from 'moment'

// TODO: this should look for 5 minutes blocks and not 15 minutes

const positionIdentifier = (position: Position) => `${position.pair}_${position.price}_${position.volume}`

// Trailing Stop/Stop-Loss
export class TrailingStopLossBot {

  constructor(
    readonly kraken: KrakenService,
    readonly positions: PositionsService,
    readonly profits: ProfitsRepo,
    readonly config: BotConfig,
  ) {
    // load positions and start watching for sell opporunities
    this.positions.findAll().then(positions => {
      positions.map(position => {
        const key = `[${position.pair}_${position.price}_${position.volume}]`
        logger.info(`Start watching sell opportunity for ${key}`)
      })
    })

    const watcher = new AssetWatcher(5, kraken, config)
    const analyst = new DownswingAnalyst(watcher, config)
    if (analyst) {
      analyst.on('ANALYST:RECOMMENDATION_TO_SELL', (data: SellRecommendation) => {
        this.handleSellRecommendation(data)
      })
    }
  }

  inWinZone(currentBidPrice: number, targetProfit: number, position: Position): boolean {
    const costs = position.price * position.volume
    const fee = costs * this.config.tax * 2
    const totalCosts = fee + costs
    const volumeToSell = round((totalCosts / currentBidPrice), 0)
    const expectedProfit = position.volume - volumeToSell

    logger.debug(`Expected profit for '${positionIdentifier(position)}': ${expectedProfit}`)

    return expectedProfit > 0 && expectedProfit >= targetProfit
  }

  async handleSellRecommendation(recommendation: SellRecommendation) {
    const currentBidPrice = await this.kraken.getBidPrice(recommendation.pair)
    const positions = await this.positions.findAll()
    positions.forEach(position => {
      if(this.inWinZone(currentBidPrice, this.config.targetProfit, position)) {
        logger.info(`Position '${positionIdentifier(position)}' is in WIN zone. Sell now! 🤑`)
        this.sellPosition(position, currentBidPrice)
      }
      else {
        logger.info(`Unfortunately position '${positionIdentifier(position)}' is not yet in WIN zone 🤬`)
      }
    })
  }

  async sellPosition(position: Position, currentBidPrice: number) {
    const costs = position.price * position.volume
    const fee = costs * this.config.tax * 2
    const totalCosts = fee + costs
    const volumeToSell = round((totalCosts / currentBidPrice), 0)
    const volumeToKeep = position.volume - volumeToSell

    if(volumeToKeep < 0) {
      throw Error(`Expected profit for position '${position.id}' would be negative. Stop the sell!`)
    }

    logger.info(`Create SELL for ${volumeToSell} '${position.pair}' for ~ ${currentBidPrice}. Keep ${volumeToKeep}`)
    const orderIds = await this.kraken.createSellOrder({ pair: position.pair, volume: volumeToSell })

    // remove from positions so that we don't seel it twice
    this.positions.delete(position)

    // keep track of executed order
    orderIds.forEach(async orderId => {
      const order = await this.kraken.getOrder(orderId)


      const msg = `Executed SELL order of ${position.pair} ${order.vol_exec}/${order.vol_exec} for ${order.price}`
      logger.info(msg)
      slack(this.config).send(msg)

      this.profits.add({
        date: moment().format(),
        soldFor: parseFloat(order.price),
        volume: parseFloat(order.vol_exec),
        profit: volumeToKeep,
        position
      })
    })
  }
}
