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

export interface BuyRecommendation {
  pair: string
  lastPrice?: number
  confidence: number
}

export type SellRecommendation = BuyRecommendation

export interface Order {
  pair: string
  price?: number
  volume: number
  type?: string
  ordertype?: string
}
