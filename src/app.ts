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
import { BetsService } from './bets/bets.service'
import connect from './common/db/connect'

// TODO: move into class
const trailingStopLossBotFactory = (krakenService: KrakenService, betsService: BetsService, profitsRepo: ProfitsRepo, config: BotConfig): TrailingStopLossBot => {
  const watcher = new AssetWatcher(5, krakenService, config)
  const analyst = new DownswingAnalyst(watcher, config)
  const bot = new TrailingStopLossBot(
    krakenService,
    betsService,
    profitsRepo,
    analyst,
    config,
  )

  watcher.start()

  return bot
}

// TODO: move into class
const botFactory = (krakenService: KrakenService, betsService: BetsService, repo: PositionsService, config: BotConfig): Bot => {
  const watcher = new AssetWatcher(15, krakenService, config)
  const upswingAnalyst = new UpswingAnalyst(watcher, config)
  const bot = new Bot(
    krakenService,
    betsService,
    repo,
    upswingAnalyst,
    config,
  )

  watcher.start()

  return bot
}


(async function() {
  console.log(config)

  setInterval(() => {}, 10000)

  await connect('mongodb://localhost:27017/kraken-prod')

  const betsService = new BetsService()
  const profitsRepo = new ProfitsRepo()
  const positionsRepo = new PositionsService()
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const krakenService = new KrakenService(krakenApi, config)

  botFactory(krakenService, betsService, positionsRepo, config)
  trailingStopLossBotFactory(krakenService, betsService, profitsRepo, config)

  //
  if (config.goal > 0) {
    profitsRepo.findAll().then((profits) => {
      const profit = profits.reduce((acc, p) => acc + p.profit, 0)
      const totalProfit = config.goalStart + profit
      logger.info(
        `Goal reached ${round((totalProfit / config.goal) * 100, 2)} %  (${
          config.goalStart
        } + ${profit}) 🚀`,
      )
    })
  }
})()
