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
import { KrakenService } from './kraken/krakenService'
import { TrailingStopLossBot } from './bots/trailingStopLossBot'
import { Bot } from './bot'
import { flatMap } from 'lodash'
import { AssetWatcher } from './assetWatcher/assetWatcher'

(async function() {

  await connect('mongodb://localhost:27017/kraken-test')

  const positionsService = new PositionsService()
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const krakenService = new KrakenService(krakenApi, config)

  // const assetWatcher = new AssetWatcher(krakenService, config)
  // assetWatcher.start([5, 15, 240])

  // positionsService.find({ pair: 'ETHUSD', status: 'open' }).then(pos => {
  //   console.log(pos)
  // })





  const position = await positionsService.create({
    pair: 'test',
    volume: 100,
    orderIds: ['test']
  })


  const updatedPosition = await positionsService.update(position, {
    status: 'open',
    'buy.volume': 200,
    'buy.price': 3,
  })

  console.log(updatedPosition)



  // const positionsService = new PositionsService()
  // const position = positionsService.create({
  //   status: 'open',
  //   pair: 'ADAUSD',
  //   price: 123,
  //   volume: 123,
  //   orderIds: []
  // })

  // const profitsRepo = new ProfitsRepo()
  // const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret + 'd')
  // const krakenService = new KrakenService(krakenApi, config)

  // const position = await positionsService.create({
  //   pair: 'test',
  //   volume: 1000,
  //   //price: 100,
  //   orderIds: [ 'a', 'b' ]
  // })

  // console.log(position)

  // const watcher = new AssetWatcher(5, krakenService, config)
  // const analyst = new DownswingAnalyst(watcher, config)
  // const sellBot = new TrailingStopLossBot(krakenService, positionsService, profitsRepo, analyst, config)

  // const watcher = new AssetWatcher(15, krakenService, config)
  // const upswingAnalyst = new UpswingAnalyst(watcher, config)
  // const bot = new Bot(krakenService, positionsService, upswingAnalyst, config)

  // const pos = await PositionModel.findById({ _id: "12366c3f093b9db102a9a67e"})
  // if(pos) {
  //   await bot.fetchOrderDetails(pos)
  //   const orderIds = [{ id: 'a' }, { id: 'b'} ]
  //   await positionsService.update(pos, {
  //     'status': 'sold',
  //     'sell.orderIds': orderIds.map(id => id.id)
  //   })
  // }

  // positionsService.findByStatus('sold').then(positions => {
  //   // console.log(positions)
  //   positions.forEach(pos => {
  //     console.log(pos.sell.volumeToKeep)
  //   })
  // })

})()

// if(this.inWinZone(currentBidPrice, this.config.targetProfit, position)) {
//   logger.info(`Position ${positionId(position)} is in WIN zone. Sell now! 🤑`)
//   const p = await this.sellPosition(position, currentBidPrice)
//   if(p) {
//     await this.evaluateProfit(p)
//   }
// }
