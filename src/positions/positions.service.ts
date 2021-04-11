import { UpdateQuery } from 'mongoose'
import { logger } from '../common/logger'
import { CreatePositionInput } from './position.interface'
import { Position } from './position.interface'
import PositionModel from './position.model'
import moment from 'moment'

export class PositionsService {

  async create(input: CreatePositionInput) {
    return PositionModel.create({
      date: moment().format(),
      pair: input.pair,
      status: input.status || 'created',
      buy: {
        volume: input.volume,
        price: input.price,
        orderIds: input.orderIds
      }
    }).catch(err => {
      logger.error(err)
      throw err
    })
  }

  async update(position: Position, update: UpdateQuery<Position>) {
    const pos = await PositionModel.findByIdAndUpdate(position._id, update, { new: true })
    return pos !== null ? pos : undefined
  }

  async save(position: Position) {
    position.save()
  }

  async delete(position: Position) {
    return PositionModel.findByIdAndDelete(position._id)
  }

  // make sure we return 'undefined' in case of we don't find the position
  async findById(id: string): Promise<Position | undefined> {
    const pos = await PositionModel.findOne({ _id: id })
    return pos !== null ? pos : undefined
  }

  async findByStatus(status: string): Promise<Position[]> {
    return PositionModel.find({ status })
  }

  async find(filter: any): Promise<Position[]> {
    return PositionModel.find(filter)
  }
}
