import { Analyst, ANALYST_EVENTS } from './analyst'
import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { AssetsWatcherUpdateEvent } from '../assetWatcher/assetWatcher.interface'
import { logger } from '../common/logger'
import { upswing } from '../indicators/macd/upswing'
import { stochastic } from '../indicators/stoachastic/stochastic'
import { round } from 'lodash'

export class BuyAnalyst extends Analyst {

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super(watcher, config)

    // subscribe to assets updates
    watcher.subscribe(this, 15)
    watcher.subscribe(this, 240)

    // register indicators
    this.registerIndicator(0.5, 240, 'STOCHF', stochastic())
    this.registerIndicator(0.5, 15, 'UPSWING', upswing(15, config.blockMaturity))
    
    // daily is on an uptrend
    //this.registerIndicator(0.5, 15, 'UPSWING', upswing(15, config.blockMaturity))

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
