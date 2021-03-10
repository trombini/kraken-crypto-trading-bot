export interface OHLCBlock {
  time: number
  close: number
  open?: number
  high?: number
  low?: number
  volume?: number
}

export interface OrderId {
  id: string
}

export interface Recommendation {
  pair: string
  lastPrice?: number
  confidence: number
}

export interface Order {
  pair: string
  price?: number
  volume: number
  type?: string
  ordertype?: string
}
