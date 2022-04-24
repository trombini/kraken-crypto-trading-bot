import { logger } from '../common/logger'
import { privateMethod, publicMethod } from './utils'

export interface IKrakenApi {
  staking: {
    stake(amount: number): Promise<void>
    unstake(amount: number): Promise<void>
  }
  ticker: {
    askPrice(pair: string): Promise<number>
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

const askPrice = (apiKey: string, apiSecret: string) => (pair: string) => {
  //return privateMethod(apiKey, apiSecret, 'Staking/Assets', params)
  return publicMethod(apiKey, apiSecret, 'Ticker', { pair }).then((response) => {
    const tickerData = response.data.result[pair.toUpperCase()]
    const bid = tickerData['b'][0]
    logger.debug(`Current BID price for ${pair} is '${bid}'`)
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
    },
  }
}
