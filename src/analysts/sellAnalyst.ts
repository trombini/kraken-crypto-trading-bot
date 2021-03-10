import { Analyst, ANALYST_EVENTS } from './analyst'
import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { AssetsWatcherUpdateEvent } from '../assetWatcher/assetWatcher.interface'
import { logger } from '../common/logger'
import { upswing } from '../indicators/macd/upswing'
import { stochastic } from '../indicators/stoachastic/stochastic'
import { round } from 'lodash'
import { downswing } from 'src/indicators/macd/downswing'

export class SellAnalyst extends Analyst {

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super(watcher, config)

    // subscribe to assets updates
    watcher.subscribe(this, 5)

    // register indicators
    this.registerIndicator(1, 5, 'UPSWING', downswing(5, 0.5))
  }

  // TODO: move to parent
  // subscriber to updates from AssetWatcher
  async analyseAssetData(event: AssetsWatcherUpdateEvent): Promise<void> {

    // save data for later
    this.data[event.period] = event.blocks

    const result = this.indicators.map((currentIndicator) => {
      //const [weight, period, name, indicator] = currentIndicator
      const { weight, period, name, indicator } = currentIndicator
      const confidence = this.data[period] === undefined ? 0 : indicator(this.data[period])
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
