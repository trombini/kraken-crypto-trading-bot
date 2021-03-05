import KrakenClient from 'kraken-api'
import { KrakenService } from './kraken/krakenService'
import { TrailingStopLossBot } from './trailingStopLossBot'
import { BotConfig, config } from './common/config'
import { Bot } from './bot'
import { logger } from './common/logger'
import { round } from 'lodash'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { PositionsService } from './positions/positions.service'
import { formatMoney } from './common/utils'
import { AssetWatcher } from './assetWatcher/assetWatcher'
import connect from './common/db/connect'

// TODO: move into class
const trailingStopLossBotFactory = (watcher: AssetWatcher, krakenService: KrakenService, positionsService: PositionsService, config: BotConfig): TrailingStopLossBot => {
  const analyst = new DownswingAnalyst(watcher, config)
  return new TrailingStopLossBot(
    krakenService,
    positionsService,
    analyst,
    config,
  )
}

// TODO: move into class
const botFactory = (watcher: AssetWatcher, krakenService: KrakenService, positionsService: PositionsService, config: BotConfig): Bot => {
  const upswingAnalyst = new UpswingAnalyst(watcher, config)
  return new Bot(
    krakenService,
    positionsService,
    upswingAnalyst,
    config,
  )
}

(async function() {
  console.log(config)

  setInterval(() => {}, 10000)

  await connect(config.mongoDb)

  const positionsService = new PositionsService()
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const krakenService = new KrakenService(krakenApi, config)
  const watcher = new AssetWatcher(krakenService, config)

  botFactory(watcher, krakenService, positionsService, config)
  trailingStopLossBotFactory(watcher, krakenService, positionsService, config)

  // start asset watcher
  //watcher.start([5, 15, 240])
  watcher.start([5, 15])


  //
  if (config.goal > 0) {

    positionsService.findByStatus('sold').then(positions => {
      const profit = positions.reduce((acc, p) => acc + (p?.sell?.profit || 0), 0)
      const totalProfit = config.goalStart + profit
      logger.info(
        `Goal of ${formatMoney(config.goal)} reached by ${round((totalProfit / config.goal) * 100, 2)} %  (${config.goalStart} + ${round(profit, 0)}) 🚀`,
      )
    })
  }
})()
