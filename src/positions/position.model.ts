import mongoose, { Schema } from 'mongoose'
import { Position } from './position.interface'

const PositionSchema: Schema = new Schema({
  date: { type: String, required: true },
  pair: { type: String, required: true },
  status: { type: String, required: true },
  buy: {
    orderIds: [{ type: String }],
    price: { type: Number },
    volume: { type: Number },
    volumeExecuted: { type: Number },
  },
  sell: {
    orderIds: [{ type: String }],
    price: { type: Number },
    volume: { type: Number },
    volumeToKeep: { type: Number },
    profit: { type: Number },
  }
})

const PositionModel = mongoose.model<Position>('Position', PositionSchema)

export default PositionModel
