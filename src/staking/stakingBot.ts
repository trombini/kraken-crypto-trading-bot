import { BotConfig } from '../common/config'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { AssetsWatcherUpdateEvent, AssetWatcherObserver } from '../assetWatcher/assetWatcher.interface'
import { PositionsService } from '../positions/positions.service'
import { generatePositionId } from '../common/utils'
import { IKrakenApi } from '../krakenPlus'
import { logger } from '../common/logger'

export const determineIfStake = (currentAskPrice: number, bid: number): boolean => {
  // console.log(`${(currentAskPrice / bid)} <= 0.93`)
  return (currentAskPrice / bid) <= 0.93
}

export const determineIfUnstake = (currentAskPrice: number, bid: number): boolean => {
  // console.log(`${(currentAskPrice / bid)} >= 0.95`)
  return (currentAskPrice / bid) >= 0.95
}

export class StakingBot implements AssetWatcherObserver {
  constructor(readonly watcher: AssetWatcher, readonly kraken: IKrakenApi, readonly positions: PositionsService, readonly config: BotConfig) {
    watcher.subscribe(this, 5)
  }

  async analyseAssetData(data: AssetsWatcherUpdateEvent): Promise<void> {
    const lastAskPrice = await this.kraken.ticker.askPrice(this.config.pair)
    if (lastAskPrice) {
      const openPositions = await this.positions.findByStatus('open')
      for (const p of openPositions) {
        const bidPrice = (p.buy.price || 0)
        if (p.staked === true && determineIfUnstake(lastAskPrice, bidPrice)) {
          logger.debug(`UNSTAKE ${generatePositionId(p)} ${p.buy.volume}`)
          if (p.buy.volume && p.buy.volume > 0) {
            await this.kraken.staking.unstake(p.buy.volume)
            await this.positions.update(p, { staked: false })
          }
        }
      }

      for (const p of openPositions) {
        const bidPrice = (p.buy.price || 0)
        if (p.staked === false && determineIfStake(lastAskPrice, bidPrice)) {
          logger.debug(`STAKE ${generatePositionId(p)} ${p.buy.volume}`)
          if (p.buy.volume && p.buy.volume > 0) {
            await this.kraken.staking.stake(p.buy.volume)
            await this.positions.update(p, { staked: true })
          }
        }
      }
    }
  }
}
