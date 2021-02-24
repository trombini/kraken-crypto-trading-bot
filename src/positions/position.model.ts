import mongoose, { Schema } from 'mongoose'
import { Position } from './position.interface'

const PositionSchema: Schema = new Schema({
  date: { type: String, required: true },
  pair: { type: String, required: true },
  status: { type: String, required: true },
  volume: { type: Number, required: true },
  volumeExecuted: { type: Number },
  price: { type: Number },
})

const PositionModel = mongoose.model<Position>('Position', PositionSchema)

export default PositionModel
