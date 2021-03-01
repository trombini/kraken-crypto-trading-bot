import KrakenClient from 'kraken-api'
import { KrakenService } from './kraken/krakenService'
import { TrailingStopLossBot } from './trailingStopLossBot'
import { ProfitsRepo } from './profit/profit.repo'
import { BotConfig, config } from './common/config'
import { Bot } from './bot'
import { logger } from './common/logger'
import { round } from 'lodash'
import { AssetWatcher } from './assetWatcher'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { PositionsService } from './positions/positions.service'
import { formatMoney } from './common/utils'
import connect from './common/db/connect'

// TODO: move into class
const trailingStopLossBotFactory = (krakenService: KrakenService, positionsService: PositionsService, config: BotConfig): TrailingStopLossBot => {
  const watcher = new AssetWatcher(5, krakenService, config)
  const analyst = new DownswingAnalyst(watcher, config)
  const bot = new TrailingStopLossBot(
    krakenService,
    positionsService,
    analyst,
    config,
  )

  watcher.start()

  return bot
}

// TODO: move into class
const botFactory = (krakenService: KrakenService, positionsService: PositionsService, config: BotConfig): Bot => {
  const watcher = new AssetWatcher(15, krakenService, config)
  const upswingAnalyst = new UpswingAnalyst(watcher, config)
  const bot = new Bot(
    krakenService,
    positionsService,
    upswingAnalyst,
    config,
  )

  watcher.start()

  return bot
}


(async function() {
  console.log(config)

  setInterval(() => {}, 10000)

  await connect(config.mongoDb)

  const positionsService = new PositionsService()
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const krakenService = new KrakenService(krakenApi, config)

  botFactory(krakenService, positionsService, config)
  trailingStopLossBotFactory(krakenService, positionsService, config)

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
