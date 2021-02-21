import KrakenClient from 'kraken-api'
import { AssetWatcher } from './assetWatcher'
import { KrakenService } from './kraken/krakenService'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { TrailingStopLossBot } from './trailingStopLossBot'
import { PositionsService } from './positions/positions.repo'
import { ProfitsRepo } from './profit/profit.repo'
import { config } from './common/config'
import { Bot } from './bot'

import { slack } from './slack/slack.service'

console.log(config)

// slack().send()

// TODO: find a better way how to run a script forever
setInterval(() => { }, 10000)

const profitsRepo = new ProfitsRepo()
const positionsService = new PositionsService()
const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
const krakenService = new KrakenService(krakenApi, config)
const buyBot = new Bot(krakenService, positionsService, config)
const trailingStopLossBot = new TrailingStopLossBot(krakenService, config, positionsService, profitsRepo)
