import { BuyAnalyst } from '../analysts/buyAnalyst'
import { SellAnalyst } from '../analysts/sellAnalyst'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { Bot } from './bot'
import { BotConfig } from '../common/config'
import { KrakenService } from '../kraken/krakenService'
import { PositionsService } from '../positions/positions.service'
import { FullProfitBot } from './fullProfitBot'
import { TakeProfitBot } from './takeProfitBot'
import { DcaService } from 'src/common/dca'

export const fullProfitBotFactory = (
  watcher: AssetWatcher,
  krakenService: KrakenService,
  positionsService: PositionsService,
  config: BotConfig,
): FullProfitBot => {
  const analyst = new SellAnalyst(watcher, config)
  return new FullProfitBot(krakenService, positionsService, analyst, config)
}

export const takeProfitBotFactory = (
  watcher: AssetWatcher,
  krakenService: KrakenService,
  positionsService: PositionsService,
  config: BotConfig,
): TakeProfitBot => {
  //const analyst = new DownswingAnalyst(watcher, config)
  const analyst = new SellAnalyst(watcher, config)
  return new TakeProfitBot(
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
  dcaService: DcaService,
  config: BotConfig,
): Bot => {
  const analyst = new BuyAnalyst(watcher, config)
  return new Bot(krakenService, positionsService, analyst, dcaService, config)
}
