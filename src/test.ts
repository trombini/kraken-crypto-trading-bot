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
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { Bot } from './bot'

(async function() {

  await connect('mongodb://localhost:27017/kraken-prod')

  const positionsService = new PositionsService()
  const profitsRepo = new ProfitsRepo()
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret + 'd')
  const krakenService = new KrakenService(krakenApi, config)

  // const watcher = new AssetWatcher(5, krakenService, config)
  // const analyst = new DownswingAnalyst(watcher, config)
  // const sellBot = new TrailingStopLossBot(krakenService, positionsService, profitsRepo, analyst, config)


  const watcher = new AssetWatcher(15, krakenService, config)
  const upswingAnalyst = new UpswingAnalyst(watcher, config)
  const bot = new Bot(krakenService, positionsService, upswingAnalyst, config)


  const pos = await PositionModel.findById({ _id: "603a46b42d21b737df8f3604"})
  if(pos) {
    await bot.fetchOrderDetails(pos)
  }


  //await bot.sellPosition(position, 100)

})()
