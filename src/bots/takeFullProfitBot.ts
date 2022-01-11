import { Analyst, ANALYST_EVENTS } from '../analysts/analyst'
import { SellRecommendation } from '../common/interfaces/interfaces'
import { KrakenService } from '../kraken/krakenService'
import { logger } from '../common/logger'
import { BotConfig } from '../common/config'
import { PositionsService } from '../positions/positions.service'
import { Position } from '../positions/position.interface'
import { positionId } from '../common/utils'
import { ProfitBot } from './profitBot'
import { LaunchDarklyService } from '../launchDarkly/launchdarkly.service'

export class TakeFullProfitBot extends ProfitBot {

  constructor(
    readonly kraken: KrakenService,
    readonly positionService: PositionsService,
    readonly analyst: Analyst,
    readonly killswitch: LaunchDarklyService,
    readonly config: BotConfig,
  ) {
    super(kraken, positionService, analyst, killswitch, config)

    if (analyst) {
      analyst.on(ANALYST_EVENTS.SELL, (data: SellRecommendation) => {
        this.handleSellRecommendation(data)
      })
    }
  }

  async createSellOrder(position: Position, currentBidPrice: number): Promise<Position | undefined> {
    if(position.buy.price && position.buy.volume) {
      try {
        logger.info(`Create SELL order for ${positionId(position)}. volume: ${position.buy.volume}, price: ~ ${currentBidPrice}, keep: 0`)

        // update the status of the position so that we don't end up selling it multiple times
        await this.positionService.update(position, {
          'status': 'selling',
          'sell.volumeToKeep': 0
        })

        // create SELL order with Kraken
        const orderIds = await this.kraken.createSellOrder({
          pair: position.pair,
          volume: position.buy.volume
        })

        logger.info(`Successfully created SELL order for ${positionId(position)}. orderIds: ${JSON.stringify(orderIds)}`)

        // mark position as sold and keep track of the orderIds
        await this.positionService.update(position, {
          'status': 'sold',
          'sell.orderIds': orderIds.map(id => id.id)
        })

        // return latest version of the position
        return this.positionService.findById(position.id)
      }
      catch(err) {
        logger.error(`Error SELL ${positionId(position)}:`, err)
        logger.error(JSON.stringify(err))
      }
    }
  }
}
