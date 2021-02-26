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
      volume: input.volume,
      price: input.price || undefined
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








  async average() {


    // const positions: number[] = []
    // for(let i = 0.01 ; i <= 1 ; i = i + 0.01 ) {
    //   positions.push(i)
    // }





    const positions: number[] = []
    for(let i = 1 ; i <= 10 ; i = i + 1) {
      //positions.push(1 + i / 100) // true
      positions.push(i / 10)
      //positions.push(i)
      //positions.push(i * 10)
    }


    const x = positions.reduce((acc, pos) => {

   
      

      
      console.log(`${pos}`)

      console.log('-----')

      return acc
    }, {})


    // const x = positions.reduce((acc, pos) => {

    //   console.log(`LOG10: ${pos} => ${Math.log10(pos)}`)
    //   console.log(`FLOOR(LOG10): ${pos} => ${Math.floor(Math.log10(pos))}`)
    //   console.log(`POW(10, FLOOR(LOG10)): ${pos} => ${Math.pow(10, Math.floor(Math.log10(pos)))}`)



    //   const x = Math.pow(10, Math.floor(Math.log10(pos)))
    //   const bucket = Math.floor(pos * (100 / x)  / 2)
    //   console.log(`${pos} => ${x} => ${bucket}`)

    //   console.log('-----')

    //   return acc
    // }, {})



    const range = 1
    const deviation = 0.02
    const buckets = range / (100 * deviation)


    const dividor = range / buckets


    console.log(`Amount of buckets: ${buckets}`)
    console.log(`Dividor: ${dividor}`)


    // const x = positions.reduce((acc, pos) => {
    //   const c = pos * 100
    //   const bucket = Math.floor(c  / dividor)
    //   console.log(`${pos} => ${bucket}`)
    //   return acc
    // }, {})








    // const range = 10
    // const buckets = 5
    // const dividor = range / buckets
    // const x = positions.reduce((acc, pos) => {
    //   const bucket = Math.floor((pos - 1) / dividor)
    //   console.log(`${pos} => ${bucket}`)
    //   return acc
    // }, {})










    // const x = positions.reduce((acc, pos) => {
    //   const price = round(pos * 100, 0)
    //   const bucket = price % 5

    //   console.log(`${price} => ${bucket}`)

    //   if(acc[bucket] === undefined) {
    //     acc[bucket] = []
    //   }
    //   (acc[bucket]).push(pos)
    //   return acc
    // }, {})

    // console.log(x)




    






    this.findByStatus('open').then(positions => {



      

    })
  }
}
