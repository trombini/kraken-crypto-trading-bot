import { BuyAnalyst } from '../analysts/buyAnalyst'
import { SellAnalyst } from '../analysts/sellAnalyst'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { Bot } from '../bot'
import { BotConfig } from '../common/config'
import { KrakenService } from '../kraken/krakenService'
import { PositionsService } from '../positions/positions.service'
import { FullProfitBot } from './fullProfitBot'
import { TrailingStopLossBot } from './trailingStopLossBot'

export const fullProfitBotFactory = (
  watcher: AssetWatcher,
  krakenService: KrakenService,
  positionsService: PositionsService,
  config: BotConfig,
): FullProfitBot => {
  const analyst = new SellAnalyst(watcher, config)
  return new FullProfitBot(krakenService, positionsService, analyst, config)
}

export const trailingStopLossBotFactory = (
  watcher: AssetWatcher,
  krakenService: KrakenService,
  positionsService: PositionsService,
  config: BotConfig,
): TrailingStopLossBot => {
  //const analyst = new DownswingAnalyst(watcher, config)
  const analyst = new SellAnalyst(watcher, config)
  return new TrailingStopLossBot(
    krakenService,
    positionsService,
    analyst,
    config,
  )
}

export const botFactory = (
  watcher: AssetWatcher,
  krakenService: KrakenService,
  positionsService: PositionsService,
  config: BotConfig,
): Bot => {
  const analyst = new BuyAnalyst(watcher, config)
  return new Bot(krakenService, positionsService, analyst, config)
}
