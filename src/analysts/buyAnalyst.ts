import { Analyst, ANALYST_EVENTS } from './analyst'
import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { logger } from '../common/logger'
import { upswing } from '../indicators/macd/upswing'
import { stochastic } from '../indicators/stoachastic/stochastic'
import { uptrend } from '../indicators/macd/uptrend'
import { rsi } from '../indicators/rsi/rsi'

export class BuyAnalyst extends Analyst {

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super(watcher, config)

    // subscribe to assets updates
    watcher.subscribe(this, 15)
    watcher.subscribe(this, 240)
    watcher.subscribe(this, 1440)

    // register indicators
    this.registerIndicator(true, 0, 15, 'UPSWING 15m', upswing(15, config.blockMaturity))
    this.registerIndicator(false, 0.45, 240, 'RSI 4h', rsi('4h'))
    this.registerIndicator(false, 0.45, 240, 'UPTREND 4h', uptrend(240, 0.5))
    this.registerIndicator(false, 0.1, 240, 'STOCHF 4h', stochastic('4h'))

    // explanation:
    // upswing is the main driver. if this is positive, we want to buy
    // uptrend and stochf are subtractors and make sure our confidence is lowered so that the bet is not 100%

    // RSI unter 70

    // StochF
    // Direction of the trend of the line. If pointing downwards -> bad confidence.
    // Angle if it will be taken over by signal trendline
  }

  sendRecommendationToBot(pair: string, confidence: number) {
    const threshold = 0
    if(confidence <= threshold) {
      logger.warn(`BUY SIGNAl detected but confidence is too low (threshold: ${threshold})`)
    }
    else {
      logger.info(`BUY SIGNAL detected for [${pair}] with confidence ${confidence}`)
      this.emit(ANALYST_EVENTS.BUY, { pair, confidence })
    }
  }
}
