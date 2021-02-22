import KrakenClient from 'kraken-api'
import { KrakenService } from './kraken/krakenService'
import { TrailingStopLossBot } from './trailingStopLossBot'
import { PositionsService } from './positions/positions.repo'
import { ProfitsRepo } from './profit/profit.repo'
import { config } from './common/config'
import { Bot } from './bot'
import { logger } from './common/logger'
import { round } from 'lodash'

console.log(config)

// TODO: find a better way how to run a script forever
setInterval(() => {}, 10000)

const profitsRepo = new ProfitsRepo()
const positionsRepo = new PositionsService()
const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
const krakenService = new KrakenService(krakenApi, config)
const trailingStopLossBot = new TrailingStopLossBot(krakenService, positionsRepo, profitsRepo, config)
const buyBot = new Bot(krakenService, positionsRepo, config)

//
if(config.goal > 0) {
  profitsRepo.findAll().then(profits => {
    const profit = profits.reduce((acc, p) => acc + p.profit, 0)
    const totalProfit = config.goalStart + profit
    logger.info(`Goal reached ${round((totalProfit / config.goal) * 100, 2)} %  (${config.goalStart} + ${profit}) 🚀`)
  })
}
