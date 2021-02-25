import mongoose from 'mongoose'

export interface CreatePositionInput {
  pair: string
  volume: number
}

export interface Position extends mongoose.Document {
  date: string
  pair: string
  status: string
  volume: number
  volumeExecuted: number
  price?: number
}

// export interface OpenBet {
//   pair: string
//   price: number
//   volume: number
// }
