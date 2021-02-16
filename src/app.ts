import KrakenClient from 'kraken-api'
import { AssetWatcher } from './assetWatcher'
import { Bot } from './bot'
import { KrakenService } from './krakenService'
import { config } from './common/config'
import { UpswingAnalyst } from './analysts/upswingAnalyst'
import { DownswingAnalyst } from './analysts/downswingAnalyst'
import { TrailingStopLossBot } from './trailingStopLossBot'

// TODO: find a better way how to run a script forever
setInterval(() => { }, 10000)

const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
//const krakenService = new MockKrakenService(krakenApi, config)
const krakenService = new KrakenService(krakenApi, config)

// Watch for uptrends to buy new positions
const assetWatcherMid = new AssetWatcher(15, krakenService, config)
const upswingAnalyst = new UpswingAnalyst(assetWatcherMid, config)
const bot = new Bot(krakenService, upswingAnalyst)

// Watch for downtrends to sell open positions
const assetWatcherShort = new AssetWatcher(5, krakenService, config)
const downswingAnalyst = new DownswingAnalyst(assetWatcherShort, config)
const trailingStopLossBot = new TrailingStopLossBot(krakenService, downswingAnalyst, config)

setTimeout(() => {
  assetWatcherShort.start()
  assetWatcherMid.start()
}, 1000)
