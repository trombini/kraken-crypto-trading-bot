import mongoose from 'mongoose'

export interface CreatePositionInput {
  pair: string
  volume: number
  orderIds: string[]
  status?: string
  price?: number
}

export interface Position extends mongoose.Document {
  date: string
  pair: string
  status: string
  staked: boolean
  buy: {
    orderIds?: string[]
    price?: number
    volume?: number
    volumeExecuted?: number
  }
  sell: {
    strategy: string,
    orderIds?: string[]
    price?: number
    volume?: number
    volumeToKeep?: number
  }
}
