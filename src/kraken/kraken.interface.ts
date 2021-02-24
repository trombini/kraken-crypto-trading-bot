
export interface KrakenApiResponse {
  error: string[]
}

export interface KrakenAddOrderApiResponse extends KrakenApiResponse {
  result: {
    desc: {
      order: string
    }
    txid: string[]
  }
}

export interface KrakenOrder {
  redif?: string
  userred: number
  status: string
  reason?: string
  opentm: number
  closetm: number
  starttm: number
  expiretm: number
  descr: {
    pair: string
    type: string
    ordertype: string
    price: string
    price2: string
    leverage: string
    order: string
    close: string
  }
  vol: string
  vol_exec: string
  cost: string
  fee: string
  price: string
  stopprice: string
  limitprice: string
  mish: string
  oflags: string
}
