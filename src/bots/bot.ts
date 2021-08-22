import { BuyRecommendation } from '../common/interfaces/interfaces'
import { KrakenService } from '../kraken/krakenService'
import { logger } from '../common/logger'
import { filter, round } from 'lodash'
import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { PositionsService } from '../positions/positions.service'
import { slack } from '../slack/slack.service'
import { Analyst, ANALYST_EVENTS } from '../analysts/analyst'
import { Position } from '../positions/position.interface'
import { formatMoney } from '../common/utils'
import { DcaService } from 'src/common/dca'
import moment from 'moment'

export const calculateRisk = (reserve: number, availableAmount: number, maxBet: number, confidence: number): number => {
  logger.debug(`Calculate risk with availableAmount: ${round(availableAmount, 2)}, reserve: ${reserve}, maxBet: ${maxBet}`)

  const realAvailableAmount = availableAmount - reserve
  if(realAvailableAmount < 0) {
    throw new Error(`availableAmount (${round(availableAmount, 2)}) is less than reserve (${reserve})`)
    // logger.debug(`availableAmount (${round(availableAmount, 2)}) is less than reserve (${reserve})`)
    // return 0
  }

  const minBet = 1000
  if(realAvailableAmount < minBet) {
    throw new Error(`availableAmount (${round(realAvailableAmount, 2)}) is less than minBet (${minBet})`)
    // logger.debug(`availableAmount (${round(realAvailableAmount, 2)}) is less than minBet (${minBet})`)
    // return 0
  }

  let bet = maxBet
  if(realAvailableAmount < maxBet) {
    logger.debug(`realAvailableAmount is only ${round(realAvailableAmount, 2)} and less than maxBet (${maxBet})`)
    bet = realAvailableAmount * 0.8
  }

  return round(bet * confidence, 2)
}

export const caluclateVolume = (risk: number, lastAskPrice: number) => {
  return round(risk / lastAskPrice, 0)
}

export class Bot {
  datastore: any[]
  watcher: AssetWatcher | undefined
  upswingAnalyst: Analyst | undefined

  constructor(
    readonly kraken: KrakenService,
    readonly positionsService: PositionsService,
    readonly analyst: Analyst,
    readonly dcaService: DcaService,
    readonly config: BotConfig
  ) {
    this.datastore = []

    if(this.analyst) {
      this.analyst.on(ANALYST_EVENTS.BUY, (recommendation: BuyRecommendation) => {
        this.handleBuyRecommendation(recommendation)
      })
    }
  }

  async handleBuyRecommendation(recommendation: BuyRecommendation): Promise<void> {
    // TODO: that threshold is wrong. it should be PERIOD + MIN_MATURITY_OF_BLOCK
    const threshold = moment().subtract(23, 'm').unix()
    const recentTrades = filter(this.datastore, trade => trade.date > threshold)
    if (recentTrades.length > 0) {
      logger.warn(`Won't buy ${recommendation.pair} as we just bought it X minutes ago.`)
      return
    }
    else {
      const position = await this.buyPosition(recommendation)
      if(position) {
        await this.fetchOrderDetails(position)
        await this.dcaService.dcaOpenPositions()
      }
    }
  }

  async buyPosition(recommendation: BuyRecommendation): Promise<Position | null | undefined> {
    logger.debug(`Create new BUY order for ${recommendation.pair}`)

    try {
      const reserve = this.config.reserve
      const maxBet = this.config.maxBet
      const availableAmount = await this.kraken.balance()
      const lastAskPrice = await this.kraken.getAskPrice(recommendation.pair)

      const risk = calculateRisk(reserve, availableAmount, maxBet, recommendation.confidence)
      const volume = caluclateVolume(risk, lastAskPrice)

      logger.info(`Create BUY order. confidence: ${recommendation.confidence}, risk: ${formatMoney(risk)}, volume: ${volume}`)

      const orderIds = await this.kraken.createBuyOrder({ pair: recommendation.pair, volume })
      const position = await this.positionsService.create({
        pair: recommendation.pair,
        volume: volume,
        orderIds: orderIds.map(id => id.id)
      })

      // make sure we keep track of trade to that we don't buy it again right away
      this.datastore.push({
        date: moment().unix(),
        pair: recommendation.pair,
      })

      // return latest version of the position
      return this.positionsService.findById(position.id)
    }
    catch(err) {
      logger.error(`Error BUY position: ${err.message}`)
    }
  }

  async fetchOrderDetails(position: Position) {
    try {
      logger.debug(`Fetch order details for orders '${position.buy.orderIds?.join(',')}'`)
      if(position.buy.orderIds && position.buy.orderIds.length > 0) {
        const orderId = position.buy.orderIds[0]
        const order = await this.kraken.getOrder({ id: orderId })
        logger.debug(`Fetch order details for order '${orderId}'`)

        if(order === undefined) {
          throw new Error(`BUY order '${JSON.stringify(orderId)}' returned 'undefined'. we need to fix this manally.`)
        }

        logger.debug(`Processed BUY order: ${JSON.stringify(order)}`)
        if(order.price === undefined || order.vol === undefined) {
          logger.error(`Order doesn't provide all the required information. We need to fix it manually in the positions.json for now.`)
        }

        // update position to watch for sell opportunity
        const volumeExecuted = parseFloat(order.vol_exec) || 0
        const price = parseFloat(order?.price) || 0
        const updatedPosition = await this.positionsService.update(position, {
          status: 'open',
          'buy.volume': volumeExecuted,
          'buy.price': price,
        })

        // make sure we let Slack know
        if(updatedPosition) {
          this.logSuccessfulExecution(updatedPosition)
        }
      }
    }
    catch(err) {
      logger.error(`Cannot fetch order details for BUY order: ${JSON.stringify(err)}`)
      slack(this.config).send(`Cannot fetch order details for BUY order: ${JSON.stringify(err)}`)
    }
  }

  logSuccessfulExecution(position: Position) {
    const msg = `BUY order created. volume: ${round(position.buy.volume || 0, 0)}, price: ${position.buy.price}`
    slack(this.config).send(msg)
    logger.info(msg)
  }
}
