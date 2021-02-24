import moment from 'moment'
import { UpdateQuery } from 'mongoose'
import { logger } from '../common/logger'
import { CreateBetInput } from './bet.interface'
import { Bet } from './bet.interface'
import BetModel from './bet.model'

export class BetsService {

  async create(input: CreateBetInput) {
    return BetModel.create({
      date: moment().format(),
      pair: input.pair,
      status: 'created',
      volume: input.volume
    }).catch(err => {
      logger.error(err)
      throw err
    })
  }

  async update(bet: Bet, update: UpdateQuery<Bet>) {
    return BetModel.findByIdAndUpdate(bet._id, update, { upsert: true })
  }

  async save(bet: Bet) {
    bet.save()
  }

  async findByStatus(status: string) {
    return BetModel.find({ status })
  }
}
