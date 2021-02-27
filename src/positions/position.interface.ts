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
  buy: {
    orderIds?: string[]
    price?: number
    volume?: number
    volumeExecuted?: number
  }
  sell: {
    orderIds?: string[]
    price?: number
    volume?: number
    volumeToKeep?: number
    profit?: number
  }
}
