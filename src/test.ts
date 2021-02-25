import { Mongoose } from 'mongoose'
import connect from './common/db/connect'
import { PositionsService } from './positions/positions.service'
import mongoose from 'mongoose'
import PositionModel from './positions/position.model'

(async function() {

  await connect('mongodb://localhost:27017/kraken-prod')

  const position = new PositionModel({
    date: '2021-02-26T03:59:01+01:00',
    pair: 'ADAUSD',
    status: 'open',
    volume: 0,
    volumeExecuted: 0,
    price: 0
  })

  position.save()

})()
