import { Analyst, ANALYST_EVENTS } from './analyst'
import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { logger } from '../common/logger'
import { upswing } from '../indicators/macd/upswing'
import { stochastic } from '../indicators/stoachastic/stochastic'
import { uptrend } from '../indicators/macd/uptrend'

export class BuyAnalyst extends Analyst {

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super(watcher, config)

    // subscribe to assets updates
    watcher.subscribe(this, 15)
    watcher.subscribe(this, 240)
    watcher.subscribe(this, 1440)

    // register indicators
    this.registerIndicator(0.6, 15, 'UPSWING 15m', upswing(15, config.blockMaturity))
    this.registerIndicator(0.2, 1440, 'UPTREND 24h', uptrend(1440, 0.2))
    this.registerIndicator(0.2, 240, 'STOCHF 4h', stochastic())

    // explanation:
    // upswing is the main driver. if this is positive, we want to buy
    // uptrend and stochf are subtractors and make sure our confidence is lowered so that the bet is not 100%
  }

  sendRecommendationToBot(pair: string, confidence: number) {
    logger.info(`BUY SIGNAL detected for [${pair}] with confidence ${confidence}`)
    this.emit(ANALYST_EVENTS.BUY, { pair, confidence })
  }
}
