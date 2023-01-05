import { last } from 'lodash'
import KrakenClient from 'kraken-api'
import moment from 'moment'

export interface OhlcApiResult{
  head: OhlcCandle | undefined
  blocks: OhlcCandle[]
}

export interface OhlcCandle {
  time: number
  close: number
  open?: number
  high?: number
  low?: number
  volume?: number
}

// array (<time>, <open>, <high>, <low>, <close>, <vwap>, <volume>, <count>)
export const mapOhlcResultToObject = (result: any[]): OhlcCandle => {
  return {
    time: parseFloat(result[0]),
    open: parseFloat(result[1]),
    high: parseFloat(result[2]),
    low: parseFloat(result[3]),
    close: parseFloat(result[4]),
    volume: parseFloat(result[6]),
  }
}

export const ohlc = (client: KrakenClient) => async (pair: string, period: number): Promise<OhlcApiResult> => {
  const periods = 100
  const since = moment()
    .subtract(period * periods, 'm')
    .unix()
  return client
    .api('OHLC', { pair, since, interval: period }, () => {})
    .then((response) => response.result[pair])
    .then((result) => {
      const blocks: OhlcCandle[] = result.map(mapOhlcResultToObject)
      const head = last(blocks)
      return {
        head,
        blocks,
      }
    })
}
