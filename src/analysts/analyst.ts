import { BotConfig } from '../common/config'
import { AssetsWatcherUpdateEvent, AssetWatcherObserver } from '../assetWatcher/assetWatcher.interface'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { logger } from '../common/logger'
import { round } from 'lodash'
import events from 'events'
import moment from 'moment'

export enum ANALYST_EVENTS {
  SELL = 'ANALYST:SELL',
  BUY = 'ANALYST:BUY'
}

export class Analyst extends events.EventEmitter implements AssetWatcherObserver {

  data: any
  indicators: any[]
  lastSignal: number | undefined

  constructor(readonly watcher: AssetWatcher, readonly config: BotConfig) {
    super()
    this.indicators = []
    this.data = {}
  }

  registerIndicator(required: boolean, weight: number, period: number, name: string, indicator: any) {
    this.indicators.push({
      weight, required, period, name, indicator
    })
  }

  // Called by the AssetWatcher we observe
  async analyseAssetData(event: AssetsWatcherUpdateEvent): Promise<void> {

    logger.debug(`Analyse period ${event.period} min`)

    // save data for later
    this.data[event.period] = event.blocks

    const result = this.indicators.map((currentIndicator) => {
      const { required, weight, period, name, indicator } = currentIndicator

      if(this.data[period] === undefined) {
        logger.warn(`Not enough data for indicator ${currentIndicator.name}`)
      }

      const confidence = this.data[period] === undefined ? -1 : indicator(this.data[period])
      return {
        required,
        name,
        weight,
        confidence
      }
    })

    // check if the mandatory signals are positive
    const mandatorySignals = result.filter(signal => signal.required)
    const positiveMandatorySignals = mandatorySignals.filter(signal => signal.confidence > 0)
    const mandatorySignalsPositive = positiveMandatorySignals.length === mandatorySignals.length

    const confidence = round(result.reduce((acc, result) => {
      return acc + (result.weight * result.confidence)
    }, 0), 2)

    logger.debug(`${this.constructor.name}, required signals: ${mandatorySignalsPositive}, confidence: ${round(confidence, 2)}, summary: ${JSON.stringify(result, undefined, 2)}`)

    if (mandatorySignalsPositive && confidence >= 0) {
    //if (mandatorySignalsPositive && confidence >= this.config.minConfidence) {
      const now = moment().unix()
      // make sure we don't trigger multiple signals simultaniously
      if(this.lastSignal === undefined || (now - this.lastSignal) > 10) {
        this.lastSignal = moment().unix()
        this.sendRecommendationToBot(event.pair, confidence)
      }
    }
  }

  sendRecommendationToBot(pair: string, confidence: number) {
    throw new Error('Method not implemented.')
  }
}
