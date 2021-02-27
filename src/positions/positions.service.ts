import { round } from 'lodash'
import moment from 'moment'
import { UpdateQuery } from 'mongoose'
import { logger } from '../common/logger'
import { CreatePositionInput } from './position.interface'
import { Position } from './position.interface'
import PositionModel from './position.model'

export class PositionsService {

  async create(input: CreatePositionInput) {
    return PositionModel.create({
      date: moment().format(),
      pair: input.pair,
      status: input.status || 'created',
      //volume: input.volume,
      //price: input.price || undefined,
      buy: {
        volume: input.volume
      }
    }).catch(err => {
      logger.error(err)
      throw err
    })
  }

  async update(position: Position, update: UpdateQuery<Position>) {
    return PositionModel.findByIdAndUpdate(position._id, update, { upsert: true })
  }

  async save(position: Position) {
    position.save()
  }

  async delete(position: Position) {
    return PositionModel.findByIdAndDelete(position._id)
  }

  async findByStatus(status: string) {
    return PositionModel.find({ status })
  }
}
