import { round } from 'lodash'
import { BotConfig } from '../common/config'
import { Logger } from '../common/logger'
import { Order, OrderId } from '../common/interfaces/interfaces'
import { KrakenAddOrderApiResponse } from './kraken.interface'
import { v4 as uuidv4 } from 'uuid'
import KrakenClient from 'kraken-api'

const logger = Logger('KrakenService')

const fakeCallbak = () => {}

const apiErrorHandler = response => response

export class KrakenService {
  constructor(readonly krakenApi: KrakenClient, readonly config: BotConfig) {}

  // https://api.kraken.com/0/private/Balance
  async balance(): Promise<any> {
    return this.krakenApi
      .api('Balance', {}, () => {})
      .then(response => {
        return response.result[this.config.cashSource]
      })
  }

  // https://www.kraken.com/features/api#get-ticker-info
  async getTicker(pair: string): Promise<any> {
    return this.krakenApi
      .api('Ticker', { pair }, fakeCallbak)
      .then((response) => response.result[pair.toUpperCase()])
  }

  // https://www.kraken.com/features/api#get-ticker-info
  async getAskPrice(pair: string): Promise<number> {
    return this.getTicker(pair)
      .then((response) => {
        const ask = round(response['a'][0], 3)
        logger.debug(`Current ASK price for ${pair} is '${ask}'`)
        return ask
      })
  }

  // https://www.kraken.com/features/api#get-ticker-info
  async getBidPrice(pair: string): Promise<number> {
    return this.getTicker(pair)
      .then((response) => {
        const bid =  round(response['b'][0], 3)
        logger.debug(`Current BID price for ${pair} is '${bid}'`)
        return bid
      })
  }

  // https://www.kraken.com/features/api#query-orders-info
  async getOrder(order: OrderId): Promise<any> {
    return this.krakenApi
      .api('QueryOrders', { txid: order.id }, fakeCallbak)
      .then(apiErrorHandler)
      .then(response => response.result[order.id])
  }

  async createSellOrder(order: Order): Promise<OrderId[]> {
    logger.debug(`New SELL order: ${order.volume} for '${order.price ? order.price : 'market'}'`)

    if (!order.volume || order.volume <= 0) {
      throw new Error('Volume is less than 1.')
    }

    return this.createBuySellOrder({
      pair: order.pair,
      volume: order.volume,
      type: 'sell',
      ordertype: 'market'
    }).then(orderIds => {
      logger.debug(`Created SELL orderIds: ${JSON.stringify(orderIds)}`)
      return orderIds
    })
  }

  /**
   * This creates a Buy Order and returns the transaction id given by Kraken
   * That doesn't necessarily mean the transaction is executed or even completed.
   * This has to be checked in a subsequent call to lookup the transaction.
   * @param order
   */
  async createBuyOrder(order: Order): Promise<OrderId[]> {
    if (!order.volume || order.volume == 0) {
      throw new Error('Requested volume to buy is zero. Nothing to buy.')
    }

    return this.createBuySellOrder({
      pair: order.pair,
      volume: order.volume,
      type: 'buy',
      ordertype: 'market'
    }).then(orderIds => {
      logger.debug(`Created BUY orderIds: ${JSON.stringify(orderIds)}`)
      return orderIds
    })
  }

  async createBuySellOrder(order: Order): Promise<OrderId[]> {
    if (this.config.bypassKrakenApi) {
      logger.info(`FAKE ${order.type} ORDER: ${order.volume} [${order.pair}]`)
      return [{ id: uuidv4() }]
    } else {
      return this.krakenApi
        .api('AddOrder', order, fakeCallbak)
        .then((response: KrakenAddOrderApiResponse) => {
          return response.result.txid.map(transactionId => {
            return {
              id: transactionId,
            }
          })
        })
    }
  }
}
