import { Analyst, ANALYST_EVENTS } from './analyst'
import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { logger } from '../common/logger'
import { stochastic } from '../indicators/stoachastic/stochastic'
import { rsi } from '../indicators/rsi/rsi'
import * as macd from '../indicators/macd'


export class BuyAnalyst extends Analyst {

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super(watcher, config)

    // subscribe to assets updates
    watcher.subscribe(this, 15)
    watcher.subscribe(this, 240)
    watcher.subscribe(this, 1440)

    // required indicators
    this.registerIndicator(true, 0.05, 15, 'UPSWING 15m', macd.upswing('15m', 15, config.blockMaturity))

    // optional indicators
    this.registerIndicator(false, 0.33, 240, 'UPTREND 4h', macd.uptrend('4h', 240, 0.5))
    this.registerIndicator(false, 0.38, 240, 'RSI 4h', rsi('4h'))
    this.registerIndicator(false, 0.24, 240, 'STOCHF 4h', stochastic('4h'))

    // explanation:
    // upswing is the main driver. if this is positive, we want to buy
    // uptrend and stochf are subtractors and make sure our confidence is lowered so that the bet is not 100%

    // RSI unter 70

    // StochF
    // Direction of the trend of the line. If pointing downwards -> bad confidence.
    // Positive if it is taken over by signal trendline
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
