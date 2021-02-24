import moment from 'moment'
import { UpdateQuery } from 'mongoose'
import { logger } from '../common/logger'
import { CreateBetInput } from './bet.interface'
import Bet, { IBet } from './bet.model'

export class BetsService {

  async create(input: CreateBetInput) {
    return Bet.create({
      date: moment().format(),
      pair: input.pair,
      status: 'created',
      volume: input.volume
    }).catch(err => {
      logger.error(err)
      throw err
    })
  }

  async update(bet: IBet, update: UpdateQuery<IBet>) {
    return Bet.findByIdAndUpdate(bet._id, update, { upsert: true })
  }

  async save(bet: IBet) {
    bet.save()
  }

  async findByStatus(status: string) {
    return Bet.find({ status })
  }
}
