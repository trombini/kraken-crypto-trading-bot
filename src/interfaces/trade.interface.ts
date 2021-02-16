
// TODO: do we really need that?
export interface Trade {
  id: string
  time: number
  pair: string
  price: number
  volume: number
  cost: number
  fee: number
  tax: number
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

export interface BuyOrder {
  pair: string
  price?: number
  volume?: number
}

export interface SellOrder {
  pair: string
  price: number
  volume: number
}

export interface BuyRecommendation {
  pair: string
  lastPrice?: number
  confidene?: number
}

export interface SellRecommendation {
  pair: string
}
