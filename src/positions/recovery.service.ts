import { logger } from '../common/logger'
import { BotConfig } from 'src/common/config'
import { PositionsService } from './positions.service'
import moment from 'moment'
import { min } from 'lodash'
import { Position } from './position.interface'
import { KrakenService } from 'src/kraken/krakenService'

// export interface IRecoveryService {
	
// }

const INTERVAL = 300

export function createRecoveryService(service: PositionsService, kraken: KrakenService, config: BotConfig) {

  const recover = async (position: Position) => {
    logger.info('Recover position:')
    logger.info(position)

    if(position.buy.orderIds) {
      const orderId = position.buy.orderIds[0]
      const order = await kraken.getOrder({ id: orderId })
      logger.debug(`Fetch order details for order '${orderId}'`)

      if(order === undefined) {
        throw new Error(`BUY order '${orderId}' returned 'undefined'. we need to fix this manally.`)
      }

      logger.debug(`Recovered order '${orderId}':`)
      logger.debug(order)

      if(order.price === undefined || order.vol === undefined) {
        logger.error(`Order doesn't provide all the required information. We need to fix it manually in the positions.json for now.`)
      }

      // update position to watch for sell opportunity
      const volumeExecuted = parseFloat(order.vol_exec) || 0
      const price = parseFloat(order?.price) || 0
      await service.update(position, {
        status: 'open',
        'buy.volume': volumeExecuted,
        'buy.price': price,
      })
    }
  }

  const interval = setInterval(async () => {
    try {
      logger.debug(`Find failed positions and recover.`)

      const treshold = moment().subtract(3, 'minutes')
      const failedCreated = await service.find({
        status: 'created',
        date: {
          $lte: treshold.toISOString(true)
        }
      })

      const failedNoPrice = await service.find({
        status: 'open',
        'buy.volume': 0,
        'buy.price': 0
      })

      const failed = [ ...failedCreated, ...failedNoPrice]
      if(failed.length > 0) {
        logger.info(`Found ${failed.length} failed position(s)`)
        for (const position of failed) {
          await recover(position)
        }
      }
    }
    catch(err) {
      logger.error(err)
    }
  }, INTERVAL * 1000)
}
