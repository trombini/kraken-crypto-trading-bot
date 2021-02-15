import { last } from 'lodash'
import { BotConfig } from './common/config'
import { BuyOrder, SellOrder, Trade } from './interfaces/trade.interface'
import moment from 'moment'
import KrakenClient from 'kraken-api'

export interface OHLCBlock {
  time: number
  close: number
  open?: number
  high?: number
  low?: number
  volume?: number
}

// array (<time>, <open>, <high>, <low>, <close>, <vwap>, <volume>, <count>)
const mapOhlcResultToObject = (result: any[]): OHLCBlock => {
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
    return this.krakenApi.api('OHLC', { pair, interval, since }, () => {})
      .then((response) => response.result[this.config.pair])
      .then((result) => {
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
    return this.krakenApi.api('Ticker', { pair }, () => {})
    .then(response => {
      return response.result[pair.toUpperCase()]
    })
  }

  // https://www.kraken.com/features/api#get-ticker-info
  async getAskPrice(pair: string): Promise<number> {
    return this.getTicker(pair).then(response => response['a'][0])
  }

  async sell(order: SellOrder): Promise<any> {
    console.log(`SELL ${order.volume} for '${order.price ? order.price : 'market'}'`)
  }

  async createBuyOrder(order: BuyOrder): Promise<Trade> {


    //return this.krakenApi.api('DDD')

    throw Error('NOT IMPLEMENTED')
  }
}
