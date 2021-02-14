import { v4 as uuidv4 } from 'uuid'
import { BotConfig } from './interfaces/botConfig.interface'
import { KrakenApi } from './krakenApi'
import { last } from 'lodash'
import moment from 'moment'
import { BuyOrder, SellOrder, Trade } from './interfaces/trade.interface'
import { priceFallsBetweenBarRange } from 'technicalindicators/declarations/volume/VolumeProfile'

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
  constructor(readonly krakenApi: KrakenApi, readonly config: BotConfig) {}

  async getOHLCData(pair: string, interval: number): Promise<any> {
    const since = moment().subtract(12, 'h').unix()
    return this.krakenApi
      .api('OHLC', { pair, interval, since })
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

  async sell(order: SellOrder): Promise<any> {
    console.log(`SELL ${order.volume} for '${order.price ? order.price : 'market'}'`)
  }

  async buy(order: BuyOrder): Promise<Trade> {
    throw Error('NOT IMPLEMENTED')
  }
}
