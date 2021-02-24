import KrakenClient from 'kraken-api'
import { KrakenService } from './kraken/krakenService'
import { TrailingStopLossBot } from './trailingStopLossBot'
import { PositionsService } from './positions/positions.repo'
import { ProfitsRepo } from './profit/profit.repo'
import { BotConfig, config } from './common/config'
import { Bot } from './bot'
import { logger } from './common/logger'
import { round } from 'lodash'
import { AssetWatcher } from './assetWatcher'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { DownswingAnalyst } from './analysts/downswingAnalyst'

console.log(config)

// TODO: find a better way how to run a script forever
setInterval(() => {}, 10000)

// TODO: TEST
const trailingStopLossBotFactory = (krakenService: KrakenService, profitsRepo: ProfitsRepo, positionsRepo: PositionsService, config: BotConfig): TrailingStopLossBot => {
  const watcher = new AssetWatcher(5, krakenService, config)
  const analyst = new DownswingAnalyst(watcher, config)
  const bot = new TrailingStopLossBot(krakenService, positionsRepo, profitsRepo, analyst, config)

  watcher.start()

  return bot
}

// TODO: TEST
const botFactory = (krakenService: KrakenService, repo: PositionsService, config: BotConfig): Bot => {
  const watcher = new AssetWatcher(15, krakenService, config)
  const upswingAnalyst = new UpswingAnalyst(watcher, config)
  const bot = new Bot(krakenService, repo, upswingAnalyst, config)

  watcher.start()

  return bot
}

const profitsRepo = new ProfitsRepo()
const positionsRepo = new PositionsService()
const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
const krakenService = new KrakenService(krakenApi, config)

const bot = botFactory(krakenService, positionsRepo, config)
const trailingStopLossBot  = trailingStopLossBotFactory(krakenService, profitsRepo, positionsRepo, config)

//
if(config.goal > 0) {
  profitsRepo.findAll().then(profits => {
    const profit = profits.reduce((acc, p) => acc + p.profit, 0)
    const totalProfit = config.goalStart + profit
    logger.info(`Goal reached ${round((totalProfit / config.goal) * 100, 2)} %  (${config.goalStart} + ${profit}) 🚀`)
  })
}
