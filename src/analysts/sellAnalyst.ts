import { Analyst, ANALYST_EVENTS } from './analyst'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { BotConfig } from '../common/config'
import { downswing } from '../indicators/macd/downswing'
import { logger } from '../common/logger'

export class SellAnalyst extends Analyst {

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super(watcher, config)

    // subscribe to assets updates
    watcher.subscribe(this, 5)

    // register indicators
    this.registerIndicator(true, 1, 5, 'DOWNSWING', downswing(5, 0.5))
  }

  sendRecommendationToBot(pair: string, confidence: number) {
    logger.info(`SELL SIGNAL detected for [${pair}] with confidence ${confidence}`)
    this.emit(ANALYST_EVENTS.SELL, { pair, confidence })
  }
}
