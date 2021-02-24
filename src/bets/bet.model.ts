import mongoose, { Schema } from 'mongoose'
import { Bet } from './bet.interface'

const BetSchema: Schema = new Schema({
  date: { type: String, required: true },
  pair: { type: String, required: true },
  status: { type: String, required: true },
  volume: { type: Number, required: true },
  volumeExecuted: { type: Number },
  price: { type: Number },
})

const BetModel = mongoose.model<Bet>('Bet', BetSchema)

export default BetModel
