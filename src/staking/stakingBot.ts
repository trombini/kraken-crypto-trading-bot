import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { AssetsWatcherUpdateEvent, AssetWatcherObserver } from '../assetWatcher/assetWatcher.interface'
import { PositionsService } from '../positions/positions.service'
import { generatePositionId } from '../common/utils'
import { IKrakenApi } from '../krakenPlus'
import { Logger } from '../common/logger'
import { round } from 'lodash'

const logger = Logger('StakingBot')

export const determineIfStake = (threshold: number, currentAskPrice: number, bid: number): boolean => {
  logger.debug(`Calculate STAKE: ${round(currentAskPrice / bid, 3)} < ${threshold}`)
  return currentAskPrice / bid < threshold
}

export const determineIfUnstake = (threshold: number, currentAskPrice: number, bid: number): boolean => {
  logger.debug(`Calculate UNSTAKE: ${round(currentAskPrice / bid, 3)} >= ${threshold}`)
  return currentAskPrice / bid >= threshold
}

const sleep = (ms: number) => {
  logger.debug(`Sleep for ${ms} ms`)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class StakingBot implements AssetWatcherObserver {
  constructor(
    readonly assetWatcher: AssetWatcher,
    readonly kraken: IKrakenApi,
    readonly positions: PositionsService,
    readonly config: BotConfig,
  ) {
    assetWatcher.subscribe(this, 5)
  }

  async analyseAssetData(data: AssetsWatcherUpdateEvent): Promise<void> {
    const lastBidPrice = await this.kraken.ticker.askPrice(this.config.pair)
    const lastAskPrice = await this.kraken.ticker.askPrice(this.config.pair)

    if (lastAskPrice) {
      const openPositions = await this.positions.findByStatus('open')
      for await (const p of openPositions) {
        const bidPrice = p.buy.price || 0
        if (p.staked === true && determineIfUnstake(this.config.unstakingThreshold, lastAskPrice, bidPrice)) {
          logger.debug(`Unstake position ${generatePositionId(p)} ${p.buy.volume}`)
          if (p.buy.volume && p.buy.volume > 0) {
            await this.kraken.staking.unstake(p.buy.volume)
            await this.positions.update(p, { staked: false })
            await sleep(1000)
          }
        }
      }

      for await (const p of openPositions) {
        const bidPrice = p.buy.price || 0
        if (p.staked === false && determineIfStake(this.config.stakingThreshold, lastAskPrice, bidPrice)) {
          logger.debug(`Stake position ${generatePositionId(p)} ${p.buy.volume}`)
          if (p.buy.volume && p.buy.volume > 0) {
            await this.kraken.staking.stake(p.buy.volume)
            await this.positions.update(p, { staked: true })
            await sleep(1000)
          }
        }
      }
    }
  }
}
