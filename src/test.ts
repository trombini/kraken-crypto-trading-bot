import { Mongoose } from 'mongoose'
import KrakenClient from 'kraken-api'
import connect from './common/db/connect'
import { PositionsService } from './positions/positions.service'
import mongoose from 'mongoose'
import PositionModel from './positions/position.model'
import { round, mapKeys, take } from 'lodash'
import { Position } from './positions/position.interface'
import moment from 'moment'
import { config } from './common/config'
import { ProfitsRepo } from './profit/profit.repo'
import { AssetWatcher } from './assetWatcher'
import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { KrakenService } from './kraken/krakenService'
import { TrailingStopLossBot } from './trailingStopLossBot'

(async function() {

  await connect('mongodb://localhost:27017/kraken-test')

  const positionsService = new PositionsService()
  const profitsRepo = new ProfitsRepo()
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret + 'd')
  const krakenService = new KrakenService(krakenApi, config)

  const watcher = new AssetWatcher(5, krakenService, config)
  const analyst = new DownswingAnalyst(watcher, config)
  const bot = new TrailingStopLossBot(krakenService, positionsService, profitsRepo, analyst, config)


  const positions = await positionsService.findByStatus('open')
  const position = positions[0]


  const orderIds = [{ id: 'a' }, { id: 'b'} ]

  await positionsService.update(position, {
    'sell.orderIds': orderIds.map(o => o.id)
  })

  await positionsService.update(position, {
    'sell.volumeToKeep': 123
  })

  //await bot.sellPosition(position, 100)

})()
