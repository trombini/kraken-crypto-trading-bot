import mongoose, { Schema } from 'mongoose'

export interface IBet extends mongoose.Document {
  date: string
  pair: string
  status: string
  volume: number
  volumeExecuted: number
  price?: number
}

const BetSchema: Schema = new Schema({
  date: { type: String, required: true },
  pair: { type: String, required: true },
  status: { type: String, required: true },
  volume: { type: Number, required: true },
  volumeExecuted: { type: Number },
  price: { type: Number },
})

export default mongoose.model<IBet>('Bet', BetSchema)
