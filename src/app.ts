import { AssetWatcher } from './assetWatcher/assetWatcher'
import { Bot } from './bot'
import { BotConfig, config } from './common/config'
import { BuyAnalyst } from './analysts/buyAnalyst'
import { formatMoney } from './common/utils'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { PositionsService } from './positions/positions.service'
import { round } from 'lodash'
import { SellAnalyst } from './analysts/sellAnalyst'
import { TrailingStopLossBot } from './trailingStopLossBot'
import connect from './common/db/connect'
import KrakenClient from 'kraken-api'

// TODO: move into class
const trailingStopLossBotFactory = (watcher: AssetWatcher, krakenService: KrakenService, positionsService: PositionsService, config: BotConfig): TrailingStopLossBot => {
  //const analyst = new DownswingAnalyst(watcher, config)
  const analyst = new SellAnalyst(watcher, config)
  return new TrailingStopLossBot(
    krakenService,
    positionsService,
    analyst,
    config,
  )
}

// TODO: move into class
const botFactory = (watcher: AssetWatcher, krakenService: KrakenService, positionsService: PositionsService, config: BotConfig): Bot => {
  const analyst = new BuyAnalyst(watcher, config)
  return new Bot(
    krakenService,
    positionsService,
    analyst,
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

  // start asset watcher
  watcher.start([5, 15, 240, 1440])
  //watcher.start([5, 15])

  // Initiate Bots
  botFactory(watcher, krakenService, positionsService, config)
  trailingStopLossBotFactory(watcher, krakenService, positionsService, config)

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
