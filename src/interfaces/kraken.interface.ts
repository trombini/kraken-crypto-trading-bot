
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
