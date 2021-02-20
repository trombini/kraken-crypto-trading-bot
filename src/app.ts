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
//const krakenService = new MockKrakenService(krakenApi, config)
const krakenService = new KrakenService(krakenApi, config)

// Watch for uptrends to buy new positions
const assetWatcherMid = new AssetWatcher(15, krakenService, config)
const upswingAnalyst = new UpswingAnalyst(assetWatcherMid, config)
const buyBot = new Bot(krakenService, upswingAnalyst, positionsService, config)

// Watch for downtrends to sell open positions
const assetWatcherShort = new AssetWatcher(5, krakenService, config)
const downswingAnalyst = new DownswingAnalyst(assetWatcherShort, config)
const trailingStopLossBot = new TrailingStopLossBot(krakenService, downswingAnalyst, config, positionsService, profitsRepo)

setTimeout(() => {
  assetWatcherShort.start()
  assetWatcherMid.start()
}, 1000)
