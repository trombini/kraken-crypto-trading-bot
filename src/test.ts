import { Mongoose } from 'mongoose'
import connect from './common/db/connect'
import { PositionsService } from './positions/positions.service'
import mongoose from 'mongoose'
import PositionModel from './positions/position.model'
import { round, mapKeys, take } from 'lodash'
import { Position } from './positions/position.interface'
import moment from 'moment'

(async function() {

  await connect('mongodb://localhost:27017/kraken-prod')

})()
