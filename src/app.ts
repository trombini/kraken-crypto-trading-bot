import KrakenClient from 'kraken-api'
import { AssetWatcher } from './assetWatcher'
import { Analyst } from './analysts/analyst'
import { Bot } from './bot'
import { KrakenService } from './krakenService'
import { config } from './common/config'
import { logger } from './common/logger'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { TrailingStopLossBot } from './trailingStopLossBot'

// TODO: find a better way how to run a script forever
setInterval(() => { }, 10000)

logger.info(JSON.stringify(config))

const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
//const krakenService = new MockKrakenService(krakenApi, config)
const krakenService = new KrakenService(krakenApi, config)
const assetWatcher = new AssetWatcher(krakenService, config)

//const upswingAnalyst = new UpswingAnalyst(assetWatcher, config)
//const bot = new Bot(krakenService, upswingAnalyst)

// Watch for downtrends to sell open positions
const downswingAnalyst = new DownswingAnalyst(assetWatcher, config)
const trailingStopLossBot = new TrailingStopLossBot(krakenService, downswingAnalyst, config)

setTimeout(() => {
  assetWatcher.start()
}, 1000)
