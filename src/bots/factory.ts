import { BuyAnalyst } from '../analysts/buyAnalyst'
import { SellAnalyst } from '../analysts/sellAnalyst'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { BuyBot } from './buyBot'
import { BotConfig } from '../common/config'
import { KrakenService } from '../kraken/krakenService'
import { PositionsService } from '../positions/positions.service'
import { TakeFullProfitBot } from './takeFullProfitBot'
import { TakeProfitBot } from './takeProfitBot'
import { DcaService } from 'src/common/dca'
import { FeatureToggle } from 'src/featureToggle/useFeatureTogle'

export const takeFullProfitBotFactory = (
  watcher: AssetWatcher,
  krakenService: KrakenService,
  positionsService: PositionsService,
  killswitch: FeatureToggle,
  config: BotConfig,
): TakeFullProfitBot => {
  const analyst = new SellAnalyst(watcher, config)
  return new TakeFullProfitBot(krakenService, positionsService, analyst, killswitch, config)
}

export const takeProfitBotFactory = (
  watcher: AssetWatcher,
  krakenService: KrakenService,
  positionsService: PositionsService,
  killswitch: FeatureToggle,
  config: BotConfig,
): TakeProfitBot => {
  //const analyst = new DownswingAnalyst(watcher, config)
  const analyst = new SellAnalyst(watcher, config)
  return new TakeProfitBot(krakenService, positionsService, analyst, killswitch, config)
}

export const buyBotFactory = (
  watcher: AssetWatcher,
  krakenService: KrakenService,
  positionsService: PositionsService,
  dcaService: DcaService,
  killswitch: FeatureToggle,
  config: BotConfig,
): BuyBot => {
  const analyst = new BuyAnalyst(watcher, config)
  return new BuyBot(krakenService, positionsService, analyst, dcaService, killswitch, config)
}
