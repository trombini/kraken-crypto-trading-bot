import { last } from 'lodash'
import { BotConfig } from '../common/config'
import { logger } from '../common/logger'
import { Order, OrderId } from '../common/interfaces/trade.interface'
import { OHLCBlock } from '../common/interfaces/trade.interface'
import { KrakenAddOrderApiResponse } from './kraken.interface'
import { v4 as uuidv4 } from 'uuid'
import KrakenClient from 'kraken-api'
import moment from 'moment'

const fakeCallbak = () => {}

const apiErrorHandler = response => response

// array (<time>, <open>, <high>, <low>, <close>, <vwap>, <volume>, <count>)
export const mapOhlcResultToObject = (result: any[]): OHLCBlock => {
  return {
    time: parseFloat(result[0]),
    open: parseFloat(result[1]),
    high: parseFloat(result[2]),
    low: parseFloat(result[3]),
    close: parseFloat(result[4]),
    volume: parseFloat(result[6]),
  }
}

export class KrakenService {
  constructor(readonly krakenApi: KrakenClient, readonly config: BotConfig) {}

  async getOHLCData(pair: string, interval: number): Promise<any> {
    const since = moment().subtract(12, 'h').unix()
    return this.krakenApi
      .api('OHLC', { pair, interval, since }, () => {})
      .then(response => response.result[this.config.pair])
      .then(result => {
        const blocks = result.map(mapOhlcResultToObject)
        const head = last(blocks)
        return {
          head,
          blocks,
        }
      })
  }

  // https://www.kraken.com/features/api#get-ticker-info
  async getTicker(pair: string): Promise<any> {
    return this.krakenApi
      .api('Ticker', { pair }, fakeCallbak)
      .then((response) => response.result[pair.toUpperCase()])
      .catch((err) => {
        logger.error(err.message)
        throw err
      })
  }

  // https://www.kraken.com/features/api#get-ticker-info
  async getAskPrice(pair: string): Promise<number> {
    return this.getTicker(pair)
      .then((response) => {
        const ask = response['a'][0]
        logger.info(`Current ASK price for ${pair} is '${ask}'`)
        return ask
      })
      .catch((err) => {
        logger.error(err.message)
        throw err
      })
  }

  // https://www.kraken.com/features/api#get-ticker-info
  async getBidPrice(pair: string): Promise<number> {
    return this.getTicker(pair)
      .then((response) => {
        const bid = response['b'][0]
        logger.info(`Current BID price for ${pair} is '${bid}'`)
        return bid
      })
      .catch((err) => {
        logger.error(err.message)
        throw err
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
      ordertype: 'market',
    })
  }

  /**
   * This creates a Buy Order and returns the transaction id given by Kraken
   * That doesn't necessarily mean the transaction is executed or even completed.
   * This has to be checked in a subsequent call to lookup the transaction.
   * @param order
   */
  async createBuyOrder(order: Order): Promise<OrderId[]> {
    logger.debug(`New BUY order: ${order.volume} for market price'`)

    if (!order.volume || order.volume <= 0) {
      throw new Error('Volume is less than 1.')
    }

    return this.createBuySellOrder({
      pair: order.pair,
      volume: order.volume,
      type: 'buy',
      ordertype: 'market',
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
        .catch(err => {
          logger.error(err.message)
          throw err
        })
    }
  }
}
