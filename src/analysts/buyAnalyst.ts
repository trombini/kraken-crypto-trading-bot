import { Analyst, ANALYST_EVENTS } from './analyst'
import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { AssetsWatcherUpdateEvent } from '../assetWatcher/assetWatcher.interface'
import { logger } from '../common/logger'
import { upswing } from '../indicators/macd/macd'
import { stochastic } from '../indicators/stoachastic/stochastic'
import { round } from 'lodash'

export class BuyAnalyst extends Analyst {

  data: any
  indicators: any[]

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super(watcher, config)
    this.data = {}

    watcher.subscribe(this, 15)
    watcher.subscribe(this, 1440)

    // weight, period of interest, indicator
    this.indicators = [
      [0.4, 1440, 'STOCHF', stochastic()],
      [0.5, 15, 'UPSWING', upswing(15, 0.8)],
    ]
  }

  // subscriber to updates from AssetWatcher
  async analyseAssetData(event: AssetsWatcherUpdateEvent): Promise<void> {
    // save data for later
    this.data[event.period] = event.blocks

    const result = this.indicators.map((currentIndicator) => {
      const [weight, period, name, indicator] = currentIndicator
      const confidence = this.data[period] !== undefined
        ? indicator(this.data[period]) : 0
      return {
        name,
        weight,
        confidence
      }
    })

    const confidence = result.reduce((acc, result) => {
      return acc + (result.weight * result.confidence)
    }, 0)

    logger.debug(`BuyAnalyst confidence: ${round(confidence, 2)}`)
    logger.debug(`${JSON.stringify(result)}`)

    if (confidence > 0.6) {
      logger.info(`BUY SIGNAL detected for [${event.pair}] with confidence ${confidence}`)
      this.sendRecommendationToBuyEvent(event.pair, confidence)
    }
  }

  sendRecommendationToBuyEvent(pair: string, confidence: number) {
    this.emit(ANALYST_EVENTS.BUY, { pair, confidence })
  }
}
