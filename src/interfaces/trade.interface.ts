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
  tax: number
}

export interface Transaction {
  id: string
}

export type OrderId = Transaction

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
