import { formatMoney, formatNumber, positionId } from '../common/utils'
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
      //volume: input.volume,
      //price: input.price || undefined,
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
    return PositionModel.findByIdAndUpdate(position._id, update, { new: true })
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

  async printSummary(pair: string) {
    const risk = await this
      .find({ pair, status: 'open' })
      .then((positions) => {
        return positions.reduce(
          (acc, position) => {
            if (position.buy.price && position.buy.volume) {
              logger.info(
                `Start watching sell opportunity for ${positionId(position)}`,
              )
              return {
                costs: acc.costs + position.buy.price * position.buy.volume,
                volume: acc.volume + position.buy.volume,
              }
            }
            return acc
          },
          { costs: 0, volume: 0 },
        )
      })
    logger.info(
      `Currently at risk: ${formatMoney(risk.costs)} $ (${formatNumber(risk.volume)})`,
    )
  }
}
