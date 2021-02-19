export interface OHLCBlock {
  time: number
  close: number
  open?: number
  high?: number
  low?: number
  volume?: number
}

export interface Position {
  id: number
  pair: string
  price: number
  volume: number
}

export interface Profit {
  volume: number
  soldFor: number
  profit: number
  position: Position
}

export interface OrderId {
  id: string
}

export interface BuyRecommendation {
  pair: string
  lastPrice?: number
  confidene?: number
}

export interface SellRecommendation {
  pair: string
}

export interface Order {
  pair: string
  price?: number
  volume: number
  type?: string
  ordertype?: string
}
