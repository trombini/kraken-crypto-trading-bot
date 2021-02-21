import KrakenClient from 'kraken-api'
import { KrakenService } from './kraken/krakenService'
import { TrailingStopLossBot } from './trailingStopLossBot'
import { PositionsService } from './positions/positions.repo'
import { ProfitsRepo } from './profit/profit.repo'
import { config } from './common/config'
import { Bot } from './bot'

console.log(config)

// TODO: find a better way how to run a script forever
setInterval(() => {}, 10000)

const profitsRepo = new ProfitsRepo()
const positionsRepo = new PositionsService()
const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
const krakenService = new KrakenService(krakenApi, config)
const trailingStopLossBot = new TrailingStopLossBot(krakenService, positionsRepo, profitsRepo, config)
const buyBot = new Bot(krakenService, positionsRepo, config)
