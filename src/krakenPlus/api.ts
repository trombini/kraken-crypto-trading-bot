import { round } from 'lodash'
import { Logger } from '../common/logger'
import { privateMethod, publicMethod } from './utils'

const logger = Logger('KrakenApi')

export interface IKrakenApi {
  staking: {
    stake(amount: number): Promise<void>
    unstake(amount: number): Promise<void>
  }
  ticker: {
    askPrice(pair: string): Promise<number>,
    bidPrice(pair: string): Promise<number>,
  }
}

const stake = (apiKey: string, apiSecret: string) => async (amount: number) => {
  if (amount > 0) {
    await privateMethod(apiKey, apiSecret, 'Stake', {
      asset: 'ADA',
      method: 'ada-staked',
      amount,
    })
  }
}

const unstake = (apiKey: string, apiSecret: string) => async (amount: number) => {
  if (amount > 0) {
    await privateMethod(apiKey, apiSecret, 'Unstake', {
      asset: 'ADA.S',
      amount,
    })
  }
}

const bidPrice = (apiKey: string, apiSecret: string) => (pair: string) => {
  //return privateMethod(apiKey, apiSecret, 'Staking/Assets', params)
  return publicMethod(apiKey, apiSecret, 'Ticker', { pair }).then((response) => {
    const tickerData = response.data.result[pair.toUpperCase()]
    const bid = round(tickerData['b'][0], 3)
    logger.debug(`[KrakenAPI] Current BID price for ${pair} is '${bid}'`)
    return bid
  })
}

const askPrice = (apiKey: string, apiSecret: string) => (pair: string) => {
  //return privateMethod(apiKey, apiSecret, 'Staking/Assets', params)
  return publicMethod(apiKey, apiSecret, 'Ticker', { pair }).then((response) => {
    const tickerData = response.data.result[pair.toUpperCase()]
    const bid = round(tickerData['a'][0], 3)
    logger.debug(`[KrakenAPI] Current ASK price for ${pair} is '${bid}'`)
    return bid
  })
}


export function createAPI(apiKey: string, apiSecret: string): IKrakenApi {
  return {
    staking: {
      stake: stake(apiKey, apiSecret),
      unstake: unstake(apiKey, apiSecret),
    },
    ticker: {
      askPrice: askPrice(apiKey, apiSecret),
      bidPrice: bidPrice(apiKey, apiSecret),
    },
  }
}
