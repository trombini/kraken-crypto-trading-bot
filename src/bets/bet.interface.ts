import mongoose from 'mongoose'

export interface CreateBetInput {
  pair: string
  volume: number
}

export interface Bet extends mongoose.Document {
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
