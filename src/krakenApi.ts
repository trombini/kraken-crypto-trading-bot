import * as crypto from 'crypto';
import axios from 'axios';

// Default options
const defaults = {
  url: 'https://api.kraken.com',
  version: 0,
  timeout: 5000,
};

// Public/Private method names
const methods = {
  public: [
    'Time',
    'Assets',
    'AssetPairs',
    'Ticker',
    'Depth',
    'Trades',
    'Spread',
    'OHLC',
  ],
  private: [
    'Balance',
    'TradeBalance',
    'OpenOrders',
    'ClosedOrders',
    'QueryOrders',
    'TradesHistory',
    'QueryTrades',
    'OpenPositions',
    'Ledgers',
    'QueryLedgers',
    'TradeVolume',
    'AddOrder',
    'CancelOrder',
    'DepositMethods',
    'DepositAddresses',
    'DepositStatus',
    'WithdrawInfo',
    'Withdraw',
    'WithdrawStatus',
    'WithdrawCancel',
    'GetWebSocketsToken',
  ],
};

export interface KrakenConfig {
  url: string;
  version: string;
  timeout: number;
}

const rawRequest = (url: string, data: any) => {
  return axios.post(url, data, {})
    .then(result => result.data)
}

export class KrakenApi {
  config: KrakenConfig

  constructor(readonly key: string, readonly secret: string, options?: any) {
    this.config = Object.assign({ key, secret }, defaults, options);
  }

  async api(method: string, params?: any): Promise<any> {
    if (methods.public.includes(method)) {
      return this.publicMethod(method, params);
    } else if (methods.private.includes(method)) {
      return this.privateMethod(method, params);
    } else {
      throw new Error(method + ' is not a valid API method.')
    }
  }

  publicMethod(method: string, params: any) {
    params = params || {};
    const url = `${this.config.url}/${this.config.version}/public/${method}`;
    return rawRequest(url, params);
  }

  privateMethod(method: string, params: any) {
    params = params || {};
    const url = `${this.config.url}/${this.config.version}/public/${method}`;
    return rawRequest(url, params);
  }
}
